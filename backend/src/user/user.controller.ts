import { 
  Controller, 
  Get, 
  Put, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Req 
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../auth/auth-user.decorator';
import { UserService } from './user.service';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ✅ Get current user profile
  @Get('me')
  getProfile(@Req() req) {
    return req.user;
  }

  // ✅ Get current user with full details
  @Get('me/details')
  async getMyDetails(@AuthUser('sub') userId: string) {
    return this.userService.getUserById(userId);
  }

  // ✅ Get current user statistics
  @Get('me/stats')
  async getMyStats(@AuthUser('sub') userId: string) {
    return this.userService.getUserStats(userId);
  }

  // ✅ Get current user's rank
  @Get('me/rank')
  async getMyRank(@AuthUser('sub') userId: string, @AuthUser('role') role: Role) {
    return this.userService.getUserRank(userId, role);
  }

  // ✅ Get current user's activity summary
  @Get('me/activity')
  async getMyActivity(
    @AuthUser('sub') userId: string,
    @Query('days') days?: string
  ) {
    const daysNumber = days ? parseInt(days) : 30;
    return this.userService.getUserActivitySummary(userId, daysNumber);
  }

  // ✅ Get leaderboard
  @Get('leaderboard')
  async getLeaderboard(
    @Query('limit') limit?: string,
    @Query('role') role?: Role
  ) {
    const limitNumber = limit ? parseInt(limit) : 10;
    return this.userService.getLeaderboard(limitNumber, role);
  }

  // ✅ ADMIN ONLY: Get all users
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getAllUsers(@Query('role') role?: Role) {
    return this.userService.getAllUsers(role);
  }

  // ✅ ADMIN ONLY: Get user by ID
  @Get(':userId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getUserById(@Param('userId') userId: string) {
    return this.userService.getUserById(userId);
  }

  // ✅ ADMIN ONLY: Get user statistics
  @Get(':userId/stats')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getUserStats(@Param('userId') userId: string) {
    return this.userService.getUserStats(userId);
  }

  // ✅ ADMIN ONLY: Update user role
  @Put(':userId/role')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateUserRole(
    @Param('userId') userId: string,
    @Body() body: { role: Role }
  ) {
    return this.userService.updateUserRole(userId, body.role);
  }

  // ✅ ADMIN ONLY: Send notification to user
  @Post(':userId/notify')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async sendNotificationToUser(
    @Param('userId') userId: string,
    @Body() body: { message: string; reportId?: string }
  ) {
    return this.userService.sendNotificationToUser(
      userId,
      body.message,
      body.reportId
    );
  }

  // ✅ ADMIN ONLY: Send notification to all users of a role
  @Post('notify/role')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async sendNotificationToRole(
    @Body() body: { role: Role; message: string; reportId?: string }
  ) {
    return this.userService.sendNotificationToRole(
      body.role,
      body.message,
      body.reportId
    );
  }

  // ✅ ADMIN ONLY: Get user activity summary
  @Get(':userId/activity')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getUserActivity(
    @Param('userId') userId: string,
    @Query('days') days?: string
  ) {
    const daysNumber = days ? parseInt(days) : 30;
    return this.userService.getUserActivitySummary(userId, daysNumber);
  }
}
