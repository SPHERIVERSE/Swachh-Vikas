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

  async recordProgress(
    userId: string,
    moduleId: string,
    type: string,
    itemId: string,
    status: string,
    xp: number,
    score?: number,
  ) {
    let result;

    switch (type) {
      case 'FLASHCARD':
        result = await this.prisma.userFlashcardProgress.upsert({
          where: { userId_flashcardId: { userId, flashcardId: itemId } },
          update: {
            mastered: status === 'MASTERED',
            xpEarned: xp,
            completedAt: status === 'MASTERED' ? new Date() : null,
          },
          create: {
            userId,
            flashcardId: itemId,
            mastered: status === 'MASTERED',
            xpEarned: xp,
            completedAt: status === 'MASTERED' ? new Date() : null,
          },
        });
        break;

      case 'VIDEO':
        result = await this.prisma.userVideoProgress.upsert({
          where: { userId_videoId: { userId, videoId: itemId } },
          update: {
            watched: status === 'COMPLETED',
            xpEarned: xp,
            completedAt: status === 'COMPLETED' ? new Date() : null,
          },
          create: {
            userId,
            videoId: itemId,
            watched: status === 'COMPLETED',
            xpEarned: xp,
            completedAt: status === 'COMPLETED' ? new Date() : null,
          },
        });
        break;

      case 'QUIZ':
        result = await this.prisma.userQuizProgress.upsert({
          where: { userId_quizId: { userId, quizId: itemId } },
          update: {
            score: status === 'COMPLETED' ? score ?? 0 : null,
            xpEarned: xp,
            completedAt: status === 'COMPLETED' ? new Date() : null,
          },
          create: {
            userId,
            quizId: itemId,
            score: status === 'COMPLETED' ? score ?? 0 : null,
            xpEarned: xp,
            completedAt: status === 'COMPLETED' ? new Date() : null,
          },
        });
        break;

      default:
        throw new Error(`Unsupported progress type: ${type}`);
    }

    // --- AUTO UPDATE MODULE PROGRESS ---
    await this.updateModuleCompletion(userId, moduleId);

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
    const totalModules = await this.prisma.trainingModule.count({ where: { role } });

    const completedModules = await this.prisma.userModuleProgress.count({
      where: { userId, completed: true },
    });

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

    const xp =
      (flashcardsXP._sum?.xpEarned || 0) +
      (videosXP._sum?.xpEarned || 0) +
      (quizzesXP._sum?.xpEarned || 0);

    const level = Math.floor(xp / 100) + 1;
    const xpToNext = 100;

    const streak = await this.calculateStreak(userId);
    const achievements = await this.getRecentAchievements(userId);

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
  async calculateStreak(userId: string) {
    // Placeholder
    return 0;
  }

  async getRecentAchievements(userId: string) {
    // Placeholder
    return [];
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
