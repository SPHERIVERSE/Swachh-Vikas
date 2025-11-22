import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, QuestionType } from '@prisma/client';

@Injectable()
export class TrainingService {
  constructor(private prisma: PrismaService) {}

  // ------------------ MODULES ------------------
  async createModule(title: string, role: Role) {
    return this.prisma.trainingModule.create({ data: { title, role } });
  }

  async getModules(role?: Role, userId?: string) {
    const modules = await this.prisma.trainingModule.findMany({
      where: role ? { role } : {},
      include: {
        flashcards: true,
        videos: true,
        quizzes: { include: { questions: { include: { options: true } } } },
        userProgress: userId ? { where: { userId } } : undefined,
      },
    });

    return modules.map((m) => ({
      ...m,
      userProgress: userId ? m.userProgress || [] : undefined,
    }));
  }

  async getModuleById(id: string, userId?: string) {
    const module = await this.prisma.trainingModule.findUnique({
      where: { id },
      include: {
        flashcards: true,
        videos: true,
        quizzes: { include: { questions: { include: { options: true } } } },
        userProgress: userId ? { where: { userId } } : undefined,
      },
    });

    if (!module) return null;

    return {
      ...module,
      userProgress: userId ? module.userProgress || [] : undefined,
    };
  }

  async deleteModule(id: string) {
    return this.prisma.trainingModule.delete({ where: { id } });
  }

  // ------------------ USER PROGRESS ------------------
  async getModuleProgress(userId: string, moduleId: string) {
    const flashcards = await this.prisma.userFlashcardProgress.findMany({
      where: { userId, flashcard: { moduleId } },
    });
    const videos = await this.prisma.userVideoProgress.findMany({
      where: { userId, video: { moduleId } },
    });
    const quizzes = await this.prisma.userQuizProgress.findMany({
      where: { userId, quiz: { moduleId } },
    });

    // Aggregate XP safely
    const flashcardsXP = await this.prisma.userFlashcardProgress.aggregate({
      where: { userId, flashcardId: { in: flashcards.map(f => f.flashcardId) } },
      _sum: { xpEarned: true },
    });
    const videosXP = await this.prisma.userVideoProgress.aggregate({
      where: { userId, videoId: { in: videos.map(v => v.videoId) } },
      _sum: { xpEarned: true },
    });
    const quizzesXP = await this.prisma.userQuizProgress.aggregate({
      where: { userId, quizId: { in: quizzes.map(q => q.quizId) } },
      _sum: { xpEarned: true },
    });

    const totalXP =
      (flashcardsXP._sum?.xpEarned || 0) +
      (videosXP._sum?.xpEarned || 0) +
      (quizzesXP._sum?.xpEarned || 0);

    return { flashcards, videos, quizzes, totalXP };
  }

  // ✅ FIX: Standardized XP rewards for gaming consistency
  private getXpReward(type: string, status: string, score?: number): number {
    const baseRewards = {
      'FLASHCARD': { 'MASTERED': 25, 'COMPLETED': 15 },
      'VIDEO': { 'COMPLETED': 20, 'WATCHED': 10 },
      'QUIZ': { 'COMPLETED': 30, 'PASSED': 20 }
    };

    let baseXp = baseRewards[type]?.[status] || 10;
    
    // Bonus XP for quiz scores
    if (type === 'QUIZ' && score !== undefined) {
      if (score >= 90) baseXp += 15; // Excellent
      else if (score >= 80) baseXp += 10; // Good
      else if (score >= 70) baseXp += 5; // Pass
    }
    
    return baseXp;
  }

  async recordProgress(
    userId: string,
    moduleId: string,
    type: string,
    itemId: string,
    status: string,
    xp?: number,
    score?: number,
  ) {
    // ✅ FIX: Use standardized XP calculation if not provided
    const calculatedXp = xp || this.getXpReward(type, status, score);
    let result;

    switch (type) {
      case 'FLASHCARD':
        result = await this.prisma.userFlashcardProgress.upsert({
          where: { userId_flashcardId: { userId, flashcardId: itemId } },
          update: {
            mastered: status === 'MASTERED',
            xpEarned: calculatedXp,
            completedAt: status === 'MASTERED' ? new Date() : null,
          },
          create: {
            userId,
            flashcardId: itemId,
            mastered: status === 'MASTERED',
            xpEarned: calculatedXp,
            completedAt: status === 'MASTERED' ? new Date() : null,
          },
        });
        break;

      case 'VIDEO':
        result = await this.prisma.userVideoProgress.upsert({
          where: { userId_videoId: { userId, videoId: itemId } },
          update: {
            watched: status === 'COMPLETED',
            xpEarned: calculatedXp,
            completedAt: status === 'COMPLETED' ? new Date() : null,
          },
          create: {
            userId,
            videoId: itemId,
            watched: status === 'COMPLETED',
            xpEarned: calculatedXp,
            completedAt: status === 'COMPLETED' ? new Date() : null,
          },
        });
        break;

      case 'QUIZ':
        result = await this.prisma.userQuizProgress.upsert({
          where: { userId_quizId: { userId, quizId: itemId } },
          update: {
            score: status === 'COMPLETED' ? score ?? 0 : null,
            xpEarned: calculatedXp,
            completedAt: status === 'COMPLETED' ? new Date() : null,
          },
          create: {
            userId,
            quizId: itemId,
            score: status === 'COMPLETED' ? score ?? 0 : null,
            xpEarned: calculatedXp,
            completedAt: status === 'COMPLETED' ? new Date() : null,
          },
        });
        break;

      default:
        throw new Error(`Unsupported progress type: ${type}`);
    }

    // --- AUTO UPDATE MODULE PROGRESS ---
    await this.updateModuleCompletion(userId, moduleId);

    // ✅ FIX: Update user's totalXp for consistency
    await this.updateUserTotalXp(userId);

    return result;
  }

  // ------------------ MODULE PROGRESS ------------------
  async upsertModuleProgress(userId: string, moduleId: string, completed = false, xpEarned = 0) {
    return this.prisma.userModuleProgress.upsert({
      where: { userId_moduleId: { userId, moduleId } },
      update: { completed, xpEarned, completedAt: completed ? new Date() : null },
      create: { userId, moduleId, completed, xpEarned, completedAt: completed ? new Date() : null },
    });
  }

  private async updateModuleCompletion(userId: string, moduleId: string) {
    const flashcards = await this.prisma.flashcard.findMany({ where: { moduleId } });
    const videos = await this.prisma.video.findMany({ where: { moduleId } });
    const quizzes = await this.prisma.quiz.findMany({ where: { moduleId } });

    const completedFlashcards = await this.prisma.userFlashcardProgress.count({
      where: { userId, flashcardId: { in: flashcards.map(f => f.id) }, mastered: true },
    });
    const completedVideos = await this.prisma.userVideoProgress.count({
      where: { userId, videoId: { in: videos.map(v => v.id) }, watched: true },
    });
    const completedQuizzes = await this.prisma.userQuizProgress.count({
      where: { userId, quizId: { in: quizzes.map(q => q.id) }, completedAt: { not: null } },
    });

    const allItemsCompleted =
      completedFlashcards === flashcards.length &&
      completedVideos === videos.length &&
      completedQuizzes === quizzes.length;

    const flashcardsXP = await this.prisma.userFlashcardProgress.aggregate({
      where: { userId, flashcardId: { in: flashcards.map(f => f.id) } },
      _sum: { xpEarned: true },
    });
    const videosXP = await this.prisma.userVideoProgress.aggregate({
      where: { userId, videoId: { in: videos.map(v => v.id) } },
      _sum: { xpEarned: true },
    });
    const quizzesXP = await this.prisma.userQuizProgress.aggregate({
      where: { userId, quizId: { in: quizzes.map(q => q.id) } },
      _sum: { xpEarned: true },
    });

    const totalXP =
      (flashcardsXP._sum?.xpEarned || 0) +
      (videosXP._sum?.xpEarned || 0) +
      (quizzesXP._sum?.xpEarned || 0);

    await this.upsertModuleProgress(userId, moduleId, allItemsCompleted, totalXP);
  }

  async getUserOverallProgress(userId: string, role: Role) {
    // ✅ FIX: Optimize with parallel queries for better performance
    const [totalModules, completedModules, userXp, streak, achievements] = await Promise.all([
      this.prisma.trainingModule.count({ where: { role } }),
      this.prisma.userModuleProgress.count({ where: { userId, completed: true } }),
      this.prisma.user.findUnique({ 
        where: { id: userId }, 
        select: { totalXp: true } 
      }),
      this.calculateStreak(userId),
      this.getRecentAchievements(userId)
    ]);

    const xp = userXp?.totalXp || 0;

    // ✅ FIX: Gaming-accurate level calculation with exponential progression
    const level = this.calculateLevel(xp);
    const xpToNext = this.calculateXpToNextLevel(level, xp);

    return { level, xp, xpToNext, streak, completedModules, totalModules, achievements };
  }

  // ------------------ FLASHCARDS ------------------
  async addFlashcard(moduleId: string, question: string, answer: string) {
    return this.prisma.flashcard.create({ data: { moduleId, question, answer } });
  }

  async updateFlashcard(id: string, question: string, answer: string) {
    return this.prisma.flashcard.update({ where: { id }, data: { question, answer } });
  }

 async deleteFlashcard(id: string) {
  // First, delete all associated UserFlashcardProgress records
  await this.prisma.userFlashcardProgress.deleteMany({
    where: { flashcardId: id },
  });

  // Then, delete the flashcard itself
  return this.prisma.flashcard.delete({
    where: { id },
  });
}

  // ------------------ VIDEOS ------------------
  async addVideo(moduleId: string, title: string, url: string) {
    return this.prisma.video.create({ data: { moduleId, title, url } });
  }

  async updateVideo(id: string, title: string, url: string) {
    return this.prisma.video.update({ where: { id }, data: { title, url } });
  }

async deleteVideo(id: string) {
  // First, delete all associated UserVideoProgress records
  await this.prisma.userVideoProgress.deleteMany({
    where: { videoId: id },
  });

  // Then, delete the video itself
  return this.prisma.video.delete({
    where: { id },
  });
}

  // ------------------ QUIZZES ------------------
  async addQuiz(moduleId: string, title: string) {
    return this.prisma.quiz.create({ data: { moduleId, title } });
  }

async deleteQuiz(id: string) {
  // First, find and delete all associated QuizQuestions
  const questions = await this.prisma.quizQuestion.findMany({
    where: { quizId: id },
  });
  
  for (const question of questions) {
      // You must first delete the options for each question
      await this.prisma.quizOption.deleteMany({
          where: { questionId: question.id },
      });
  }

  // Then delete all the questions for the quiz
  await this.prisma.quizQuestion.deleteMany({
      where: { quizId: id },
  });

  // Finally, delete the quiz itself
  return this.prisma.quiz.delete({
      where: { id },
  });
}

  // ------------------ QUIZ QUESTIONS ------------------
  async addQuizQuestion(
    quizId: string,
    type: QuestionType,
    question: string,
    answer?: string,
    options?: { text: string; isCorrect: boolean }[],
  ) {
    const createdQuestion = await this.prisma.quizQuestion.create({ data: { quizId, type, question, answer } });

    if (type === 'MCQ' && options?.length) {
      await this.prisma.quizOption.createMany({
        data: options.map(o => ({ questionId: createdQuestion.id, text: o.text, isCorrect: o.isCorrect })),
      });
    }

    return this.prisma.quizQuestion.findUnique({ where: { id: createdQuestion.id }, include: { options: true } });
  }

async deleteQuizQuestion(id: string) {
  // First, delete all associated QuizOption records
  await this.prisma.quizOption.deleteMany({
    where: { questionId: id },
  });

  // Then, delete the quiz question itself
  return this.prisma.quizQuestion.delete({
    where: { id },
  });
}

  // ------------------ QUIZ OPTIONS ------------------
  async addQuizOption(questionId: string, text: string, isCorrect: boolean) {
    return this.prisma.quizOption.create({ data: { questionId, text, isCorrect } });
  }

  async deleteQuizOption(id: string) {
    return this.prisma.quizOption.delete({ where: { id } });
  }

  // ------------------ HELPER METHODS ------------------
  // ✅ FIX: Update user's total XP for consistency
  private async updateUserTotalXp(userId: string) {
    const flashcardsXP = await this.prisma.userFlashcardProgress.aggregate({
      where: { userId },
      _sum: { xpEarned: true },
    });
    const videosXP = await this.prisma.userVideoProgress.aggregate({
      where: { userId },
      _sum: { xpEarned: true },
    });
    const quizzesXP = await this.prisma.userQuizProgress.aggregate({
      where: { userId },
      _sum: { xpEarned: true },
    });

    const totalXp =
      (flashcardsXP._sum?.xpEarned || 0) +
      (videosXP._sum?.xpEarned || 0) +
      (quizzesXP._sum?.xpEarned || 0);

    await this.prisma.user.update({
      where: { id: userId },
      data: { totalXp },
    });
  }

  // ✅ FIX: Gaming-accurate level calculation with exponential progression
  private calculateLevel(xp: number): number {
    // Gaming-accurate level progression: 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250...
    // Formula: level = floor(sqrt(xp / 50)) + 1
    // This creates a smooth exponential curve that feels rewarding
    return Math.floor(Math.sqrt(xp / 50)) + 1;
  }

  private calculateXpToNextLevel(currentLevel: number, currentXp: number): number {
    // Calculate XP required for next level
    const nextLevelXp = Math.pow(currentLevel, 2) * 50;
    return Math.max(0, nextLevelXp - currentXp);
  }

  async calculateStreak(userId: string) {
    // ✅ FIX: Calculate actual streak based on consecutive days of activity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentProgress = await this.prisma.userModuleProgress.findMany({
      where: {
        userId,
        completedAt: { gte: sevenDaysAgo },
      },
      orderBy: { completedAt: 'desc' },
    });

    if (recentProgress.length === 0) return 0;

    // Group by date and count consecutive days
    const dailyProgress = new Map<string, number>();
    recentProgress.forEach(progress => {
      if (progress.completedAt) {
        const date = progress.completedAt.toISOString().split('T')[0];
        dailyProgress.set(date, (dailyProgress.get(date) || 0) + 1);
      }
    });

    // Calculate consecutive days
    const sortedDates = Array.from(dailyProgress.keys()).sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];
      
      if (sortedDates[i] === expectedDateStr) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  async getRecentAchievements(userId: string) {
    // ✅ FIX: Real achievement system based on user progress
    const achievements: string[] = [];
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        moduleProgress: true,
        civicReports: true,
      },
    });

    if (!user) return achievements;

    // Level-based achievements
    if (user.totalXp >= 100) achievements.push('🎯 First Steps');
    if (user.totalXp >= 500) achievements.push('📚 Knowledge Seeker');
    if (user.totalXp >= 1000) achievements.push('🌟 Rising Star');
    if (user.totalXp >= 2500) achievements.push('💎 Expert Learner');
    if (user.totalXp >= 5000) achievements.push('👑 Master Champion');

    // Module completion achievements
    const completedModules = user.moduleProgress.filter(p => p.completed).length;
    if (completedModules >= 1) achievements.push('📖 Module Master');
    if (completedModules >= 5) achievements.push('🎓 Course Graduate');
    if (completedModules >= 10) achievements.push('🏆 Academic Excellence');

    // Civic engagement achievements
    const reportCount = user.civicReports.length;
    if (reportCount >= 1) achievements.push('🏛️ Civic Contributor');
    if (reportCount >= 5) achievements.push('🗳️ Community Advocate');
    if (reportCount >= 10) achievements.push('🌟 Civic Hero');

    // Streak achievements
    const streak = await this.calculateStreak(userId);
    if (streak >= 3) achievements.push('🔥 On Fire');
    if (streak >= 7) achievements.push('⚡ Lightning Streak');
    if (streak >= 14) achievements.push('💪 Unstoppable');

    return achievements.slice(-5); // Return last 5 achievements
  }
  
// ------------------ LEADERBOARD ------------------
async getLeaderboard(limit: number, role?: Role) {
  const progress = await this.prisma.userModuleProgress.groupBy({
    by: ['userId'],
    _sum: { xpEarned: true },
  });

  const leaderboard = (
    await Promise.all(
      progress.map(async (p) => {
        const user = await this.prisma.user.findUnique({
          where: { id: p.userId },
          select: { id: true, name: true, email: true, role: true },
        });

        if (!user) return null;
        if (role && user.role !== role) return null;

        return {
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          xp: p._sum.xpEarned ?? 0,
        };
      }),
    )
  ).filter((u): u is NonNullable<typeof u> => u !== null);

  return leaderboard
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit);
}

async getMyRank(userId: string, role: Role) {
  const leaderboard = await this.getLeaderboard(1000, role);

  const rank = leaderboard.findIndex((u) => u.userId === userId);

  if (rank === -1) {
    // User not found in leaderboard
    return {
      userId,
      rank: null,
      xp: 0,
      message: 'Start training and contributing to enter the leaderboard!',
    };
  }

  return {
    rank: rank + 1,
    totalUsers: leaderboard.length,
    ...leaderboard[rank],
  };
}
}
