import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuizStatus, Role } from '@prisma/client';
import { CleanCoinService } from '../cleancoin/cleancoin.service';
import { TransactionSource } from '@prisma/client';

@Injectable()
export class BusinessService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => CleanCoinService))
    private cleanCoinService: CleanCoinService,
  ) {}

  // ----------------------------------------------------
  // CREATE CSR FUND
  // ----------------------------------------------------
  async createCSRFund(businessId: string, dto: any) {
    const amountValue =
      typeof dto.amount === 'string' ? parseFloat(dto.amount) : dto.amount;

    if (isNaN(amountValue) || amountValue <= 0) {
      throw new BadRequestException('Amount must be a positive number.');
    }

    return this.prisma.cSRFund.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        amount: amountValue,
        allocatedAmount: 0,
        businessId,
      },
    });
  }

  // ----------------------------------------------------
  // GET FUNDS FOR BUSINESS
  // ----------------------------------------------------
  async getFunds(businessId: string) {
    return this.prisma.cSRFund.findMany({
      where: { businessId },
      include: { allocations: true },
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

  // ----------------------------------------------------
  // ALLOCATE CSR FUND
  // ----------------------------------------------------
  async allocateCSRFund(fundId: string, businessId: string, dto: any) {
    const fund = await this.prisma.cSRFund.findUnique({ where: { id: fundId } });
    if (!fund) throw new NotFoundException('CSR Fund not found.');

    if (fund.businessId !== businessId) {
      throw new NotFoundException('CSR Fund not owned by this business.');
    }

    const amountValue =
      typeof dto.amount === 'string' ? parseFloat(dto.amount) : dto.amount;

    if (isNaN(amountValue) || amountValue <= 0) {
      throw new BadRequestException('Invalid allocation amount.');
    }

    const availableAmount = fund.amount - fund.allocatedAmount;
    if (availableAmount < amountValue) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${availableAmount}, Requested: ${amountValue}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const allocation = await tx.cSRFundAllocation.create({
        data: {
          fundId,
          amount: amountValue,
          purpose: dto.purpose ?? null,
        },
      });

      await tx.cSRFund.update({
        where: { id: fundId },
        data: {
          amount: { decrement: amountValue },
          allocatedAmount: { increment: amountValue },
        },
      });

      return allocation;
    });
  }

  // ----------------------------------------------------
  // COMMUNITY DRIVES
  // ----------------------------------------------------
  async createDrive(organizerId: string, dto: any) {
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDate = dto.endDate ? new Date(dto.endDate) : new Date();

    return this.prisma.communityDrive.create({
      data: {
        title: dto.title,
        description: dto.description ?? '',
        location: dto.location ?? '',
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        startDate,
        endDate,
        status: dto.status ?? 'UPCOMING',
        targetParticipants: dto.targetParticipants ?? null,
        rewardAmount: dto.rewardAmount ?? 0,
        organizerId,
      },
    });
  }

  async getCommunityDrives(organizerId: string) {
    return this.prisma.communityDrive.findMany({
      where: { organizerId },
      include: { participants: true },
      orderBy: { startDate: 'desc' },
    });
  }

  // ----------------------------------------------------
  // AWARENESS QUIZZES
  // ----------------------------------------------------
  async createAwarenessQuiz(organizerId: string, dto: any) {
    if (dto.endDate <= dto.startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDate = dto.endDate ? new Date(dto.endDate) : new Date();

    // Transform questions to match expected format
    const questions = dto.questions?.map((q: any) => ({
      question: q.question,
      options: q.options,
      correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : parseInt(q.correctAnswer) || 0,
    })) || [];

    return this.prisma.awarenessQuiz.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        questions: questions, // Store as JSON
        rewardAmount: dto.rewardAmount ?? 0,
        cleanCoinReward: dto.cleanCoinReward ?? 0,
        maxAttempts: dto.maxAttempts ?? 1,
        startDate,
        endDate,
        status: QuizStatus.DRAFT, // Always start as DRAFT
        targetRole: dto.targetRole || null,
        organizerId,
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

  async getQuizParticipationCount(quizId: string, userId: string): Promise<number> {
    return this.prisma.awarenessQuizParticipation.count({
      where: { quizId, userId },
    });
  }

  async getAwarenessQuizzes(organizerId: string) {
    return this.prisma.awarenessQuiz.findMany({
      where: { organizerId },
      include: { participations: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActiveQuizzes(role?: Role) {
    const whereClause: any = {
      status: QuizStatus.ACTIVE,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    };

    if (role) {
      whereClause.targetRole = role;
    }

    return this.prisma.awarenessQuiz.findMany({
      where: whereClause,
      include: {
        organizer: { select: { id: true, name: true, businessType: true } },
        _count: {
          select: { participations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async submitQuizParticipation(quizId: string, userId: string, data: {
    answers: any[];
    score: number;
  }) {
    const quiz = await this.prisma.awarenessQuiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');

    if (quiz.status !== QuizStatus.ACTIVE) {
      throw new BadRequestException('Quiz is not active');
    }

    const now = new Date();
    if (now < quiz.startDate || now > quiz.endDate) {
      throw new BadRequestException('Quiz is not currently available');
    }

    // Check attempt limit
    const attemptCount = await this.prisma.awarenessQuizParticipation.count({
      where: { quizId, userId },
    });

    if (attemptCount >= quiz.maxAttempts) {
      throw new BadRequestException(`Maximum attempts (${quiz.maxAttempts}) reached`);
    }

    // Calculate reward (70% threshold)
    const rewardEarned = data.score >= 70 ? quiz.rewardAmount : 0;

    const participation = await this.prisma.awarenessQuizParticipation.create({
      data: {
        quizId,
        userId,
        answers: data.answers,
        score: data.score,
        rewardEarned,
        completedAt: new Date(),
      },
    });

    // Award CleanCoins if eligible
    if (rewardEarned > 0 && quiz.cleanCoinReward > 0 && data.score >= 70) {
      await this.cleanCoinService.awardCoins(
        userId,
        quiz.cleanCoinReward,
        TransactionSource.QUIZ_COMPLETION,
        `Completed quiz: ${quiz.title}`,
        // THIS IS THE CORRECT 5TH ARGUMENT (metadata object):
        { quizId: quizId } 
      );
    }

    return participation;
  }

  async getUserQuizParticipation(quizId: string, userId: string) {
    return this.prisma.awarenessQuizParticipation.findFirst({
      where: { quizId, userId },
      orderBy: { completedAt: 'desc' },
    });
  }
}

