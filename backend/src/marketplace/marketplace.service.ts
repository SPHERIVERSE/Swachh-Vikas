// src/marketplace/marketplace.service.ts

import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// FIX: Removed BidStatus from import to prevent potential TS errors
import { WasteType, ListingStatus, Role, TransactionSource } from '@prisma/client';
import { CleanCoinService } from '../cleancoin/cleancoin.service';

@Injectable()
export class MarketplaceService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => CleanCoinService))
    private cleanCoinService: CleanCoinService,
  ) {}

  // Create a waste listing
  async createListing(data: {
    wasteType: WasteType;
    title: string;
    description?: string;
    imageUrl?: string;
    weight: number;
    price?: number;
    latitude: number;
    longitude: number;
    sellerId: string;
  }) {
    return this.prisma.wasteListing.create({
      data: {
        wasteType: data.wasteType,
        title: data.title,
        description: data.description || '',
        imageUrl: data.imageUrl || null,
        weight: data.weight,
        price: data.price || null,
        latitude: data.latitude,
        longitude: data.longitude,
        sellerId: data.sellerId,
        status: ListingStatus.ACTIVE,
      },
      include: {
        seller: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  // Get all active listings (for businesses)
  async getAllListings(filters?: {
    wasteType?: WasteType;
    minWeight?: number;
    maxWeight?: number;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
  }) {
    const where: any = {
      status: ListingStatus.ACTIVE,
    };

    if (filters?.wasteType) {
      where.wasteType = filters.wasteType;
    }

    if (filters?.minWeight || filters?.maxWeight) {
      where.weight = {};
      if (filters.minWeight) where.weight.gte = filters.minWeight;
      if (filters.maxWeight) where.weight.lte = filters.maxWeight;
    }

    const listings = await this.prisma.wasteListing.findMany({
      where,
      include: {
        seller: { select: { id: true, name: true, avatarUrl: true } },
        // FIX: Removed deep 'bids' include for general listings query to prevent performance and potential TS errors
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by location if provided
    if (filters?.latitude && filters?.longitude && filters?.radiusKm) {
      return listings.filter(listing => {
        const distance = this.calculateDistance(
          filters.latitude!,
          filters.longitude!,
          listing.latitude,
          listing.longitude
        );
        return distance <= filters.radiusKm!;
      });
    }

    return listings;
  }

  // Get user's listings
  async getUserListings(userId: string) {
    return this.prisma.wasteListing.findMany({
      where: { sellerId: userId },
      include: {
        buyer: { select: { id: true, name: true } },
        bids: {
          include: {
            bidder: { select: { id: true, name: true, businessType: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Place a bid on a listing
  async placeBid(listingId: string, bidderId: string, data: { amount: number; message?: string }) {
    const listing = await this.prisma.wasteListing.findUnique({
      where: { id: listingId },
    });

    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException('Listing is not available for bidding');
    }

    // Verify bidder is a business
    const bidder = await this.prisma.user.findUnique({
      where: { id: bidderId },
    });

    if (!bidder || bidder.role !== Role.BUSINESS) {
      throw new ForbiddenException('Only businesses can place bids');
    }

    // Check if bidder already has a pending bid
    const existingBid = await this.prisma.wasteBid.findFirst({
      where: {
        listingId,
        bidderId,
        status: 'PENDING',
      },
    });

    if (existingBid) {
      throw new BadRequestException('You already have a pending bid on this listing');
    }

    const bid = await this.prisma.wasteBid.create({
      data: {
        listingId,
        bidderId,
        amount: data.amount,
        message: data.message || null,
        status: 'PENDING',
      },
      include: {
        bidder: { select: { id: true, name: true } },
        listing: { select: { title: true, sellerId: true } },
      },
    });

    // Notify the seller about new bid
    const systemReport = await this.prisma.civicReport.findFirst({
      where: { title: { contains: 'System Notification' } },
      select: { id: true },
    });

    if (systemReport) {
      await this.prisma.notification.create({
        data: {
          userId: listing.sellerId,
          reportId: systemReport.id,
          message: `💰 New bid of ₹${data.amount} on your listing "${listing.title}" from ${bidder.name}${data.message ? `: "${data.message}"` : ''}`,
        },
      });
    }

    return bid;
  }

  // Get bids for a listing
  async getListingBids(listingId: string, userId: string) {
    const listing = await this.prisma.wasteListing.findUnique({
      where: { id: listingId },
    });

    if (!listing) throw new NotFoundException('Listing not found');
    
    // Only seller or businesses can view bids
    if (listing.sellerId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.role !== Role.BUSINESS) {
        throw new ForbiddenException('Not authorized to view bids');
      }
    }

    return this.prisma.wasteBid.findMany({
      where: { listingId },
      include: {
        bidder: { select: { id: true, name: true, businessType: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Accept a bid (citizen accepts business bid)
  async acceptBid(bidId: string, sellerId: string) {
    const bid = await this.prisma.wasteBid.findUnique({
      where: { id: bidId },
      include: {
        listing: true,
        bidder: true,
      },
    });

    if (!bid) throw new NotFoundException('Bid not found');
    if (bid.listing.sellerId !== sellerId) {
      throw new ForbiddenException('Not authorized to accept this bid');
    }
    if (bid.listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException('Listing is no longer active');
    }
    if (bid.status !== 'PENDING') {
      throw new BadRequestException('Bid is not pending');
    }

    // Update bid status to accepted
    await this.prisma.wasteBid.update({
      where: { id: bidId },
      data: { status: 'ACCEPTED' },
    });

    // Reject all other bids
    await this.prisma.wasteBid.updateMany({
      where: {
        listingId: bid.listingId,
        id: { not: bidId },
        status: 'PENDING',
      },
      data: { status: 'REJECTED' },
    });

    // Update listing status
    const updated = await this.prisma.wasteListing.update({
      where: { id: bid.listingId },
      data: {
        status: ListingStatus.SOLD,
        buyerId: bid.bidderId,
        soldAt: new Date(),
      },
      include: {
        seller: { select: { id: true, name: true } },
        buyer: { select: { id: true, name: true } },
      },
    });

    // Notify the buyer
    const systemReport = await this.prisma.civicReport.findFirst({
      where: { title: { contains: 'System Notification' } },
      select: { id: true },
    });

    if (systemReport) {
      await this.prisma.notification.create({
        data: {
          userId: bid.bidderId,
          reportId: systemReport.id,
          message: `Your bid of ₹${bid.amount} on "${bid.listing.title}" has been accepted!`,
        },
      });
    }

    // Award CleanCoins to the seller for successful marketplace sale (+10 CC)
    try {
      const hasEarned = await this.cleanCoinService.hasEarnedForAction(
        updated.sellerId,
        TransactionSource.MARKETPLACE_SALE,
        { listingId: updated.id }
      );
      
      if (!hasEarned) {
        await this.cleanCoinService.awardCoins(
          updated.sellerId,
          10,
          TransactionSource.MARKETPLACE_SALE,
          `Successfully sold: ${updated.title}`,
          { listingId: updated.id }
        );
      }
    } catch (error) {
      // Log error but don't fail the sale
      console.error('Failed to award CleanCoins for marketplace sale:', error);
    }

    return updated;
  }

  // Get user's bids (for businesses)
  async getUserBids(userId: string) {
    return this.prisma.wasteBid.findMany({
      where: { bidderId: userId },
      include: {
        listing: {
          include: {
            seller: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get past deals for a user (sold listings)
  async getPastDeals(userId: string, role: Role) {
    if (role === Role.CITIZEN) {
      // Get listings sold by this citizen
      return this.prisma.wasteListing.findMany({
        where: {
          sellerId: userId,
          status: ListingStatus.SOLD,
        },
        include: {
          buyer: { select: { id: true, name: true, businessType: true } },
          bids: {
            where: { status: 'ACCEPTED' },
            include: {
              bidder: { select: { id: true, name: true } },
            },
            take: 1, // Only need the accepted bid for price
          },
        },
        orderBy: { soldAt: 'desc' },
      });
    } else if (role === Role.BUSINESS) {
      // Get listings purchased by this business
      return this.prisma.wasteListing.findMany({
        where: {
          buyerId: userId,
          status: ListingStatus.SOLD,
        },
        include: {
          seller: { select: { id: true, name: true } },
          bids: {
            where: { status: 'ACCEPTED', bidderId: userId },
            include: {
              bidder: { select: { id: true, name: true } },
            },
            take: 1, // Only need the accepted bid for price
          },
        },
        orderBy: { soldAt: 'desc' },
      });
    }
    return [];
  }

  // Calculate distance between two coordinates (Haversine formula)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
