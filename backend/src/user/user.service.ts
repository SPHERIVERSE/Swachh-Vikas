import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, ReportType } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // ✅ Get all users with detailed information
  async getAllUsers(role?: Role) {
    return this.prisma.user.findMany({
      where: role ? { role } : {},
      include: {
        moduleProgress: {
          include: {
            module: true,
          },
        },
        courseCompletions: {
          include: {
            course: true,
          },
        },
        civicReports: true,
        posts: true,
        followers: true,
        following: true,
        notifications: {
          where: { isRead: false },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ✅ Get user by ID with full details
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        moduleProgress: {
          include: {
            module: true,
          },
        },
        courseCompletions: {
          include: {
            course: true,
          },
        },
        civicReports: true,
        notifications: true,
        posts: true,
        reactions: true,
        followers: {
          include: {
            following: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
        following: {
          include: {
            follower: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ✅ Update user role
  async updateUserRole(userId: string, role: Role) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  // ✅ Get user statistics
  async getUserStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        moduleProgress: true,
        courseCompletions: true,
        civicReports: true,
        posts: true,
        reactions: true,
        followers: true,
        following: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const completedModules = user.moduleProgress.filter(p => p.completed).length;
    const totalModules = user.moduleProgress.length;
    const completedCourses = user.courseCompletions.length;
    const reportsCreated = user.civicReports.length;
    const postsCreated = user.posts.length;
    const followersCount = user.followers.length;
    const followingCount = user.following.length;

    return {
      ...user,
      stats: {
        completedModules,
        totalModules,
        completedCourses,
        reportsCreated,
        postsCreated,
        followersCount,
        followingCount,
        completionRate: totalModules > 0 ? (completedModules / totalModules) * 100 : 0,
      },
    };
  }

  // ✅ Get leaderboard data
  async getLeaderboard(limit: number = 10, role?: Role) {
    const users = await this.prisma.user.findMany({
      where: role ? { role } : {},
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        totalXp: true,
        role: true,
        createdAt: true,
        moduleProgress: {
          where: { completed: true },
        },
        courseCompletions: true,
        civicReports: true,
      },
      orderBy: { totalXp: 'desc' },
      take: limit,
    });

    return users.map((user, index) => ({
      ...user,
      rank: index + 1,
      completedModules: user.moduleProgress.length,
      completedCourses: user.courseCompletions.length,
      reportsCreated: user.civicReports.length,
    }));
  }

  // ✅ Get user's rank
  async getUserRank(userId: string, role?: Role) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totalXp: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const usersWithHigherXp = await this.prisma.user.count({
      where: {
        totalXp: { gt: user.totalXp },
        role: role || user.role,
      },
    });

    const totalUsers = await this.prisma.user.count({
      where: { role: role || user.role },
    });

    return {
      rank: usersWithHigherXp + 1,
      totalUsers,
      percentile: totalUsers > 0 ? ((totalUsers - usersWithHigherXp) / totalUsers) * 100 : 0,
    };
  }

  // ✅ Send notification to user
  async sendNotificationToUser(userId: string, message: string, reportId?: string) {
    // Find a default report for general notifications if none provided
    let finalReportId = reportId;
    
    if (!finalReportId) {
      // Get or create a system notification report
      const systemReport = await this.prisma.civicReport.findFirst({
        where: {
          title: { contains: 'System Notification' },
        },
        select: { id: true },
      });
      
      if (systemReport) {
        finalReportId = systemReport.id;
      } else {
        // Create a system notification report if none exists
        // Get any admin user to use as creator, or use the userId (which should be admin for notifications)
        const createdReport = await this.prisma.civicReport.create({
          data: {
            title: 'System Notification',
            description: 'This is a system notification placeholder',
            type: ReportType.public_bin_request, // Use an existing type
            latitude: 0,
            longitude: 0,
            createdById: userId, // Use admin user ID
            status: 'resolved',
          },
        });
        finalReportId = createdReport.id;
      }
    }

    return this.prisma.notification.create({
      data: {
        userId,
        reportId: finalReportId,
        message,
      },
    });
  }

  // ✅ Send notification to all users of a role
  async sendNotificationToRole(role: Role, message: string, reportId?: string) {
    const users = await this.prisma.user.findMany({
      where: { role },
      select: { id: true },
    });

    return this.prisma.notification.createMany({
      data: users.map(user => ({
        userId: user.id,
        reportId: reportId || '',
        message,
      })),
    });
  }

  // ✅ Get user activity summary
  async getUserActivitySummary(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [moduleProgress, courseCompletions, reports, posts] = await Promise.all([
      this.prisma.userModuleProgress.findMany({
        where: {
          userId,
          completedAt: { gte: startDate },
        },
        include: { module: true },
      }),
      this.prisma.courseCompletion.findMany({
        where: {
          userId,
          completedAt: { gte: startDate },
        },
        include: { course: true },
      }),
      this.prisma.civicReport.findMany({
        where: {
          createdById: userId,
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.communityPost.findMany({
        where: {
          authorId: userId,
          createdAt: { gte: startDate },
        },
      }),
    ]);

    return {
      period: `${days} days`,
      moduleProgress,
      courseCompletions,
      reports,
      posts,
      totalActivities: moduleProgress.length + courseCompletions.length + reports.length + posts.length,
    };
  }
}
