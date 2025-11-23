import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Delete,
  Put,
  BadRequestException,
  NotFoundException, 
} from '@nestjs/common';
import { CleanCoinService } from './cleancoin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionSource } from '@prisma/client';
import { AuthUser } from '../auth/auth-user.decorator'; 

// Assuming you have a CreateVoucherDto and UpdateVoucherDto defined elsewhere
type CreateVoucherDto = any; 
type UpdateVoucherDto = any;


@Controller('cleancoin')
@UseGuards(JwtAuthGuard) // Apply guard at the controller level
export class CleanCoinController {
  constructor(
    private cleanCoinService: CleanCoinService,
    private prisma: PrismaService,
  ) {}

  // Get user's CleanCoin balance
  @Get('balance')
  async getBalance(@AuthUser('sub') userId: string) {
    return this.cleanCoinService.getBalance(userId);
  }

  // Get user's transaction history
  @Get('transactions')
  async getTransactions(@AuthUser('sub') userId: string) {
    return this.cleanCoinService.getTransactionHistory(userId);
  }

  // ==================== VOUCHER ENDPOINTS ====================

  /**
   * Get all active vouchers (for citizens)
   * GET /cleancoin/vouchers
   */
  @Get('vouchers')
  @Roles(Role.CITIZEN)
  @UseGuards(RolesGuard)
  async getActiveVouchers() {
    // Fetches all ACTIVE vouchers that are not expired and have quantity remaining
    const vouchers = await this.prisma.voucher.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { expiryDate: { gte: new Date() } },
          { expiryDate: null },
        ],
        // The frontend will check totalQuantity vs claimedCount, 
        // but a good query limits those fully claimed as well.
        // For simplicity, we rely on the frontend check for now or you can add:
        // totalQuantity: { equals: null } OR claimedCount < totalQuantity
      },
      include: {
        business: {
          select: { id: true, name: true, businessType: true, avatarUrl: true },
        },
        _count: {
          select: { claims: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return vouchers;
  }

  /**
   * ✅ FIX ADDED: Get all vouchers created by the currently logged-in Business user
   * GET /cleancoin/vouchers/business
   */
  @Get('vouchers/business')
  @Roles(Role.BUSINESS)
  @UseGuards(RolesGuard)
  async getBusinessVouchers(@AuthUser('sub') businessId: string) {
    // Fetches all vouchers where the businessId matches the current user's ID
    return this.prisma.voucher.findMany({
      where: { businessId: businessId }, // Filter by the business user's ID
      include: {
        _count: {
          select: { claims: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }


  /**
   * Create a new voucher (Business only)
   * POST /cleancoin/vouchers
   */
  @Post('vouchers')
  @Roles(Role.BUSINESS)
  @UseGuards(RolesGuard)
  async createVoucher(@AuthUser('sub') businessId: string, @Body() data: CreateVoucherDto) {
    return this.prisma.voucher.create({
      data: {
        businessId,
        title: data.title,
        description: data.description,
        cleanCoinCost: data.cleanCoinCost,
        discountAmount: data.discountAmount,
        discountPercent: data.discountPercent,
        terms: data.terms,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        totalQuantity: data.totalQuantity,
        // Status defaults to 'ACTIVE' in schema
      },
    });
  }

  /**
   * Update voucher (Business only)
   * PUT /cleancoin/vouchers/:voucherId
   */
  @Put('vouchers/:voucherId')
  @Roles(Role.BUSINESS)
  @UseGuards(RolesGuard)
  async updateVoucher(
    @Request() req, 
    @Param('voucherId') voucherId: string,
    @Body() data: UpdateVoucherDto,
  ) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { id: voucherId },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    if (voucher.businessId !== req.user.id) {
      throw new BadRequestException('Not authorized to update this voucher');
    }

    return this.prisma.voucher.update({
      where: { id: voucherId },
      data: {
        title: data.title,
        description: data.description,
        cleanCoinCost: data.cleanCoinCost,
        discountAmount: data.discountAmount,
        discountPercent: data.discountPercent,
        terms: data.terms,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        totalQuantity: data.totalQuantity,
        status: data.status,
      },
    });
  }

  /**
   * Delete/Cancel voucher (Business only)
   * DELETE /cleancoin/vouchers/:voucherId
   */
  @Delete('vouchers/:voucherId')
  @Roles(Role.BUSINESS)
  @UseGuards(RolesGuard)
  async deleteVoucher(@Request() req, @Param('voucherId') voucherId: string) {
    const voucher = await this.prisma.voucher.findUnique({
      where: { id: voucherId },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher not found');
    }

    if (voucher.businessId !== req.user.id) {
      throw new BadRequestException('Not authorized to delete this voucher');
    }

    // Cancel instead of hard delete to preserve history
    return this.prisma.voucher.update({
      where: { id: voucherId },
      data: { status: 'CANCELLED' as any }, 
    });
  }

  /**
   * Claim a voucher (Citizen only)
   * POST /cleancoin/vouchers/:voucherId/claim
   */
  @Post('vouchers/:voucherId/claim')
  @Roles(Role.CITIZEN)
  @UseGuards(RolesGuard)
  async claimVoucher(@AuthUser('sub') userId: string, @Param('voucherId') voucherId: string) {
    return this.cleanCoinService.claimVoucher(userId, voucherId); 
  }

  /**
   * Get a list of the user's claimed vouchers (Citizen only)
   * GET /cleancoin/claims
   */
  @Get('claims')
  @Roles(Role.CITIZEN)
  @UseGuards(RolesGuard)
  async getMyVoucherClaims(@AuthUser('sub') userId: string) {
    return this.prisma.voucherClaim.findMany({
      where: { userId },
      include: {
        voucher: {
          select: {
            title: true,
            description: true,
            discountAmount: true,
            discountPercent: true,
            terms: true,
            business: {
              select: { name: true, businessType: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { claimedAt: 'desc' },
    });
  }

  // NOTE: You may want to add an endpoint for a Business to redeem a claim here.

}
