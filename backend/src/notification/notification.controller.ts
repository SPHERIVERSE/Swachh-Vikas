import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
// Assuming these paths and files exist from your directory tree
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 
import { AuthUser } from '../auth/auth-user.decorator'; 

@Controller('notification') 
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // GET /notification
  @Get()
  async getNotifications(@AuthUser('sub') userId: string) {
    return this.notificationService.getNotifications(userId);
  }
  
  // GET /notification/unread-count
  @Get('unread-count')
  async getUnreadCount(@AuthUser('sub') userId: string) {
    const count = await this.notificationService.getUnreadCount(userId);
    // Return an object for consistency
    return { count }; 
  }

  // POST /notification/:id/read
  @Post(':id/read')
  async markAsRead(@Param('id') notificationId: string, @AuthUser('sub') userId: string) {
    return this.notificationService.markAsRead(notificationId, userId);
  }
  
  // ✅ FIX: Added the missing POST /notification/read-all endpoint
  @Post('read-all')
  async markAllAsRead(@AuthUser('sub') userId: string) {
      await this.notificationService.markAllAsRead(userId);
      return { success: true, message: 'All notifications marked as read' };
  }
}
