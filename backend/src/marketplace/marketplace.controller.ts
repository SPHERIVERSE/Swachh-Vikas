// src/marketplace/marketplace.controller.ts (The final corrected content)

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Express } from 'express';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../auth/auth-user.decorator';
import { WasteType, Role } from '@prisma/client';

@Controller('marketplace')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post('listings')
  @Roles('CITIZEN')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: '../frontend/public/marketplace-uploads',
        filename: (_, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  async createListing(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @AuthUser('sub') sellerId: string,
  ) {
    const { wasteType, title, description, weight, price, latitude, longitude } = body;

    if (!wasteType || !title || !weight || !latitude || !longitude) {
      throw new BadRequestException('Missing required fields');
    }

    return this.marketplaceService.createListing({
      wasteType: wasteType as WasteType,
      title,
      description: description || '',
      // FIX TS2322: Change 'null' to 'undefined' to match the DTO/Service type of `string | undefined`
      imageUrl: file ? `/marketplace-uploads/${file.filename}` : undefined,
      weight: parseFloat(weight),
      price: price ? parseFloat(price) : undefined,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      sellerId,
    });
  }

  @Get('listings')
  @Roles('BUSINESS', 'ADMIN')
  async getAllListings(
    @Query('wasteType') wasteType?: WasteType,
    @Query('minWeight') minWeight?: string,
    @Query('maxWeight') maxWeight?: string,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('radiusKm') radiusKm?: string,
  ) {
    return this.marketplaceService.getAllListings({
      wasteType,
      minWeight: minWeight ? parseFloat(minWeight) : undefined,
      maxWeight: maxWeight ? parseFloat(maxWeight) : undefined,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      radiusKm: radiusKm ? parseFloat(radiusKm) : undefined,
    });
  }

  @Get('my-listings')
  @Roles('CITIZEN')
  async getMyListings(@AuthUser('sub') userId: string) {
    return this.marketplaceService.getUserListings(userId);
  }

  // --- NEW BIDDING ENDPOINTS ---

  @Post('listings/:id/bid')
  @Roles('BUSINESS')
  async placeBid(
    @Param('id') listingId: string,
    @AuthUser('sub') bidderId: string,
    @Body('amount') amount: number,
    @Body('message') message?: string,
  ) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Bid amount must be a positive number');
    }
    return this.marketplaceService.placeBid(listingId, bidderId, { amount, message });
  }

  @Get('listings/:id/bids')
  @Roles('CITIZEN', 'BUSINESS') // Citizen seller, or Business bidder wanting to check their bid
  async getListingBids(@Param('id') listingId: string, @AuthUser('sub') userId: string) {
    return this.marketplaceService.getListingBids(listingId, userId);
  }

  @Post('bids/:id/accept')
  @Roles('CITIZEN') // Only the seller (Citizen) can accept a bid
  async acceptBid(@Param('id') bidId: string, @AuthUser('sub') sellerId: string) {
    return this.marketplaceService.acceptBid(bidId, sellerId);
  }
  
  // --- PAST DEALS ENDPOINT ---

  @Get('past-deals')
  @Roles('CITIZEN', 'BUSINESS')
  async getPastDeals(@AuthUser('sub') userId: string, @AuthUser('role') role: Role) {
    // Note: The 'role' is passed from the JwtAuthGuard/AuthUser decorator based on the token
    return this.marketplaceService.getPastDeals(userId, role);
  }
}
