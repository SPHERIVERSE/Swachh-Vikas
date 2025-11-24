import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType, TransactionSource } from '@prisma/client'; 

// NOTE: Using 'any' for types that are implicitly defined by Prisma client
type VoucherClaim = any;

@Injectable()
export class CleanCoinService {
  constructor(private prisma: PrismaService) {}

  // Award CleanCoins to a user
  async awardCoins(
    userId: string,
    amount: number,
    source: TransactionSource,
    description?: string,
    metadata?: {
      courseId?: string;
      reportId?: string;
      listingId?: string;
      quizId?: string;
    }
  ) {
    if (!userId) {
        throw new BadRequestException('User ID is required to award coins.');
    }
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create transaction record
    const transaction = await this.prisma.cleanCoinTransaction.create({
      data: {
        userId,
        amount,
        type: TransactionType.EARNED,
        source,
        description,
        courseId: metadata?.courseId,
        reportId: metadata?.reportId,
        listingId: metadata?.listingId,
        quizId: metadata?.quizId,
      },
    });

    // Update user balance
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        cleanCoinBalance: {
          increment: amount,
        },
      },
    });

    return transaction;
  }

  // Spend CleanCoins (for voucher purchases)
  async spendCoins(
    userId: string,
    amount: number,
    source: TransactionSource,
    description?: string,
    metadata?: {
      courseId?: string;
      reportId?: string;
      listingId?: string;
    }
  ) {
    if (!userId) {
        throw new BadRequestException('User ID is required to spend coins.');
    }
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    // Check if user exists and has balance
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.cleanCoinBalance < amount) {
      throw new BadRequestException('Insufficient CleanCoin balance.');
    }

    // Create transaction record
    const transaction = await this.prisma.cleanCoinTransaction.create({
      data: {
        userId,
        amount: -amount, // Store as negative for spent coins
        type: TransactionType.SPENT,
        source,
        description,
        courseId: metadata?.courseId,
        reportId: metadata?.reportId,
        listingId: metadata?.listingId,
      },
    });

    // Update user balance
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        cleanCoinBalance: {
          decrement: amount,
        },
      },
    });

    return transaction;
  }

  // ✅ FIX: ADDED MISSING 'claimVoucher' METHOD
  async claimVoucher(userId: string, voucherId: string): Promise<VoucherClaim> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 1. Find Voucher and check basic conditions
    const voucher = await this.prisma.voucher.findUnique({
      where: { id: voucherId },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    if (voucher.status !== 'ACTIVE') {
      throw new BadRequestException('Voucher is not active.');
    }

    if (voucher.expiryDate && voucher.expiryDate < new Date()) {
      throw new BadRequestException('Voucher has expired.');
    }

    if (voucher.totalQuantity !== null && voucher.claimedCount >= voucher.totalQuantity) {
      throw new BadRequestException('Voucher is out of stock.');
    }
    
    if (user.cleanCoinBalance < voucher.cleanCoinCost) {
      throw new BadRequestException('Insufficient CleanCoin balance.');
    }

    // 2. Check if user already claimed this voucher
    // This relies on the @@unique([userId, voucherId]) constraint in schema.prisma
    // We check it here to provide a clean BadRequestException instead of a Prisma error
    const existingClaim = await this.prisma.voucherClaim.findUnique({
        where: { 
            userId_voucherId: { 
                userId, 
                voucherId 
            } 
        },
    });

    if (existingClaim) {
        throw new BadRequestException('You have already claimed this voucher.');
    }


    // 3. Execute claim and spend in a transaction
    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        // A. Spend Coins (decrement user balance and create transaction)
        // We do this manually inside the transaction to ensure atomicity
        await prisma.user.update({
          where: { id: userId },
          data: {
            cleanCoinBalance: {
              decrement: voucher.cleanCoinCost,
            },
          },
        });

        await prisma.cleanCoinTransaction.create({
          data: {
            userId,
            amount: voucher.cleanCoinCost,
            type: TransactionType.SPENT,
            source: TransactionSource.VOUCHER_CLAIM,
            description: `Claimed voucher: ${voucher.title}`,
            voucherId: voucher.id, 
          },
        });

        // B. Create Voucher Claim
        const claim = await prisma.voucherClaim.create({
          data: {
            userId,
            voucherId,
          },
        });

        // C. Update Voucher count
        await prisma.voucher.update({
          where: { id: voucherId },
          data: {
            claimedCount: {
              increment: 1,
            },
            // Note: totalQuantity is NOT decremented here. The quantity check at the start
            // and the `claimedCount` update are sufficient for tracking.
          },
        });

        return claim;
      });

      return result;
    } catch (error) {
      // Re-throw specific errors if they occur inside the transaction
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Prisma Transaction Error during voucher claim:', error);
      throw new InternalServerErrorException('Failed to process voucher claim transaction.');
    }
  }


  // Get user's CleanCoin balance
  async getBalance(userId: string) {
    if (!userId) {
        throw new BadRequestException('User ID is required to get balance.');
    }
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, cleanCoinBalance: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      userId: user.id,
      balance: user.cleanCoinBalance,
    };
  }

  // Get user's transaction history
  async getTransactionHistory(userId: string, limit = 50) {
    if (!userId) {
        return []; 
    }
    return this.prisma.cleanCoinTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Check if user has already earned coins for a specific action (to prevent duplicates)
  async hasEarnedForAction(
    userId: string,
    source: TransactionSource,
    metadata?: {
      courseId?: string;
      reportId?: string;
      listingId?: string;
    }
  ): Promise<boolean> {
    if (!userId) {
        return false;
    }
    
    const where: any = {
      userId,
      source,
      type: TransactionType.EARNED,
    };

    if (metadata?.courseId) {
      where.courseId = metadata.courseId;
    }
    if (metadata?.reportId) {
      where.reportId = metadata.reportId;
    }
    if (metadata?.listingId) {
        where.listingId = metadata.listingId;
    }
    
    const count = await this.prisma.cleanCoinTransaction.count({ where });
    return count > 0;
  }
}
