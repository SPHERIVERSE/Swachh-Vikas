// src/notification/notification.service.ts

import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationService {
  // Inject PrismaService
  constructor(private prisma: PrismaService) {}

  /**
   * Called by other services (e.g., CivicReportService) to generate a new notification.
   */
  async createNotification(dto: CreateNotificationDto) {
    // ❌ REMOVED: Placeholder logic ('NOT_APPLICABLE') is no longer needed 
    // because reportId is now nullable (String?) in the Prisma schema.
      
    try {
        return this.prisma.notification.create({
            data: {
                userId: dto.userId,
                message: dto.message,
                
                // ✅ CLEAN FIX: Passes null if the field is omitted in the DTO
                reportId: dto.reportId ?? null, 
                
                // ✅ CLEAN FIX: Passes null if the field is omitted in the DTO
                type: dto.type ?? null, 
                
                isRead: dto.isRead ?? false,
            },
        });
    } catch (error) {
        console.error('Prisma Error creating notification:', error);
        throw new InternalServerErrorException('Failed to create notification.');
    }
  }

  /**
   * Fetches the user's latest notifications for the panel.
   * Fetches the 20 most recent for performance.
   */
  async getNotifications(userId: string) {
// ... (rest of function remains the same)
    return this.prisma.notification.findMany({
      where: {
        userId: userId, // Selects notifications where the current user is the recipient
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20, 
    });
  }

  /**
   * Fast count for the bell icon badge.
   */
// ... (rest of service remains the same)
  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
        where: { userId: userId, isRead: false },
    });
  }

  /**
   * Marks a single notification as read, ensuring ownership validation.
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification not found`);
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Not authorized to mark this notification as read');
    }
    
    // Only update if it's currently unread
    if (notification.isRead) {
        return notification; 
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }
  
  async markAllAsRead(userId: string) {
      return this.prisma.notification.updateMany({
          where: {
              userId: userId,
              isRead: false,
          },
          data: {
              isRead: true,
          },
      });
  }
}
