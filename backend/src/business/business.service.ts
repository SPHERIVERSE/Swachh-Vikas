import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, DriveStatus, QuizStatus, TransactionSource } from '@prisma/client';
import { CleanCoinService } from '../cleancoin/cleancoin.service';

@Injectable()
export class BusinessService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => CleanCoinService))
    private cleanCoinService: CleanCoinService,
  ) {}

  // CSR Funds Management
  async createCSRFund(businessId: string, data: { title: string; description?: string; amount: number }) {
    return this.prisma.cSRFund.create({
      data: {
        title: data.title,
        description: data.description || '',
        amount: data.amount,
        businessId,
      },
    });
  }

  async getCSRFunds(businessId: string) {
    return this.prisma.cSRFund.findMany({
      where: { businessId },
      include: {
        allocations: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get all CSR funds (Admin only)
  async getAllCSRFunds() {
    return this.prisma.cSRFund.findMany({
      include: {
        business: {
          select: {
            id: true,
            name: true,
            email: true,
            businessType: true,
          },
        },
        allocations: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async allocateCSRFund(fundId: string, businessId: string, data: { amount: number; purpose: string }) {
    const fund = await this.prisma.cSRFund.findUnique({ where: { id: fundId } });
    if (!fund) throw new NotFoundException('CSR Fund not found');
    if (fund.businessId !== businessId) throw new ForbiddenException('Not authorized');
    if (fund.allocatedAmount + data.amount > fund.amount) {
      throw new BadRequestException('Allocation exceeds available amount');
    }

    await this.prisma.cSRFund.update({
      where: { id: fundId },
      data: { allocatedAmount: { increment: data.amount } },
    });

    return this.prisma.cSRFundAllocation.create({
      data: {
        fundId,
        amount: data.amount,
        purpose: data.purpose,
      },
    });
  }

  // Community Drives
  async createCommunityDrive(businessId: string, data: {
    title: string;
    description: string;
    location: string;
    latitude?: number;
    longitude?: number;
    startDate: Date;
    endDate: Date;
    targetParticipants?: number;
    rewardAmount?: number;
  }) {
    if (data.endDate <= data.startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    return this.prisma.communityDrive.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        startDate: data.startDate,
        endDate: data.endDate,
        targetParticipants: data.targetParticipants || null,
        rewardAmount: data.rewardAmount || null,
        organizerId: businessId,
        status: DriveStatus.UPCOMING,
      },
    });
  }

  async getCommunityDrives(businessId: string) {
    return this.prisma.communityDrive.findMany({
      where: { organizerId: businessId },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Awareness Quizzes
  async createAwarenessQuiz(businessId: string, data: {
    title: string;
    description?: string;
    questions: any[];
    rewardAmount: number;
    cleanCoinReward?: number;
    targetRole?: Role;
    maxAttempts: number;
    startDate: Date;
    endDate: Date;
  }) {
    if (data.endDate <= data.startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    return this.prisma.awarenessQuiz.create({
      data: {
        title: data.title,
        description: data.description || '',
        questions: data.questions,
        rewardAmount: data.rewardAmount,
        cleanCoinReward: data.cleanCoinReward || 0,
        targetRole: data.targetRole || null,
        maxAttempts: data.maxAttempts,
        startDate: data.startDate,
        endDate: data.endDate,
        organizerId: businessId,
        status: QuizStatus.DRAFT,
      },
    });
  }

  async activateQuiz(quizId: string, businessId: string) {
    const quiz = await this.prisma.awarenessQuiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz.organizerId !== businessId) throw new ForbiddenException('Not authorized');

    return this.prisma.awarenessQuiz.update({
      where: { id: quizId },
      data: { status: QuizStatus.ACTIVE },
    });
  }

  async getAwarenessQuizzes(businessId: string) {
    return this.prisma.awarenessQuiz.findMany({
      where: { organizerId: businessId },
      include: {
        participations: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get all active quizzes (for citizens/workers to participate)
  async getActiveQuizzes(userRole?: Role) {
    const where: any = {
      status: QuizStatus.ACTIVE,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    };

    // Filter by target role if specified
    if (userRole) {
      where.OR = [
        { targetRole: null }, // Quizzes for all roles
        { targetRole: userRole }, // Quizzes for specific role
      ];
    }

    return this.prisma.awarenessQuiz.findMany({
      where,
      include: {
        organizer: { select: { id: true, name: true, businessType: true } },
        _count: {
          select: { participations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get user's participation count for a quiz
  async getQuizParticipationCount(quizId: string, userId: string): Promise<number> {
    return this.prisma.awarenessQuizParticipation.count({
      where: { quizId, userId },
    });
  }

  // Submit quiz participation
  async submitQuizParticipation(quizId: string, userId: string, data: {
    answers: any[];
    score: number;
  }) {
    const quiz = await this.prisma.awarenessQuiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (quiz.status !== QuizStatus.ACTIVE) {
      throw new BadRequestException('Quiz is not active');
    }

    // Check attempts
    const existingAttempts = await this.prisma.awarenessQuizParticipation.count({
      where: { quizId, userId },
    });

    if (existingAttempts >= quiz.maxAttempts) {
      throw new BadRequestException('Maximum attempts reached');
    }

    const participation = await this.prisma.awarenessQuizParticipation.create({
      data: {
        quizId,
        userId,
        answers: data.answers,
        score: data.score,
        rewardEarned: data.score >= 70 ? quiz.rewardAmount : 0, // 70% threshold
      },
      include: {
        user: { select: { id: true, name: true } },
        quiz: { select: { title: true, organizerId: true, cleanCoinReward: true } },
      },
    });

    // Award XP reward if eligible
    if (participation.rewardEarned > 0) {
      await this.prisma.reward.create({
        data: {
          title: `Quiz Reward: ${quiz.title}`,
          description: `Reward for completing awareness quiz`,
          amount: participation.rewardEarned,
          type: 'XP',
          businessId: quiz.organizerId,
          recipientId: userId,
        },
      });

      // Update user XP
      await this.prisma.user.update({
        where: { id: userId },
        data: { totalXp: { increment: participation.rewardEarned } },
      });
    }

    // Award CleanCoins if eligible (70% threshold)
    if (data.score >= 70 && quiz.cleanCoinReward > 0) {
      try {
        await this.cleanCoinService.awardCoins(
          userId,
          quiz.cleanCoinReward,
          TransactionSource.QUIZ_COMPLETION,
          `Completed quiz: ${quiz.title}`,
        );
      } catch (error) {
        console.error('Failed to award CleanCoins for quiz completion:', error);
        // Don't fail the participation if CleanCoin award fails
      }
    }

    // Notify user
    const systemReport = await this.prisma.civicReport.findFirst({
      where: { title: { contains: 'System Notification' } },
      select: { id: true },
    });

    if (systemReport) {
      let message = '';
      if (participation.rewardEarned > 0 && quiz.cleanCoinReward > 0 && data.score >= 70) {
        message = `🎉 You earned ${participation.rewardEarned} XP and ${quiz.cleanCoinReward} CleanCoins for completing the quiz "${quiz.title}"!`;
      } else if (participation.rewardEarned > 0) {
        message = `🎉 You earned ${participation.rewardEarned} XP for completing the quiz "${quiz.title}"!`;
      } else if (quiz.cleanCoinReward > 0 && data.score >= 70) {
        message = `🎉 You earned ${quiz.cleanCoinReward} CleanCoins for completing the quiz "${quiz.title}"!`;
      } else {
        message = `✅ You completed the quiz "${quiz.title}"!`;
      }

      if (message) {
        await this.prisma.notification.create({
          data: {
            userId,
            reportId: systemReport.id,
            message,
          },
        });
      }
    }

    return participation;
  }
}


