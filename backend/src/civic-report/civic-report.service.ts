import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// Ensure all required enums are imported
import { ReportType, ReportStatus, Role } from '@prisma/client';

@Injectable()
export class CivicReportService {
  constructor(private prisma: PrismaService) {}

  async createReport(data: {
    title: string;
    description?: string;
    type: ReportType;
    imageUrl?: string | null;
    latitude: number;
    longitude: number;
    createdById: string;
  }) {
    const report = await this.prisma.civicReport.create({
      data: {
        title: data.title,
        description: data.description || '',
        type: data.type,
        imageUrl: data.imageUrl || null,
        latitude: data.latitude,
        longitude: data.longitude,
        createdBy: {
          connect: { id: data.createdById },
        },
      },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
        supports: true,
      },
    });

    return this.formatReportResponse(report, data.createdById);
  }

  async getAllReports(currentUserId: string) {
    const reports = await this.prisma.civicReport.findMany({
      include: {
        supports: true,
        createdBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reports.map((report) =>
      this.formatReportResponse(report, currentUserId),
    );
  }

  async getAdminReports(currentUserId: string) {
    const reports = await this.prisma.civicReport.findMany({
      where: { supportCount: { gte: 5 } },
      include: {
        supports: true,
        createdBy: { select: { id: true, name: true, role: true } },
        assignedToWorker: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reports.map((report) => this.formatReportResponse(report, currentUserId));
  }

  async getMyReports(userId: string) {
    const reports = await this.prisma.civicReport.findMany({
      where: { createdById: userId },
      include: {
        supports: true,
        createdBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reports.map((report) => this.formatReportResponse(report, userId));
  }
  
  // Add this new method to the CivicReportService class
  async withdrawReport(reportId: string, userId: string) {
    const report = await this.prisma.civicReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.createdById !== userId) {
      throw new ForbiddenException('You do not have permission to withdraw this report');
    }

    await this.prisma.civicReport.delete({
      where: { id: reportId },
    });

    return { message: 'Report withdrawn successfully' };
  }

  async getOtherReports(userId: string) {
    const reports = await this.prisma.civicReport.findMany({
      where: { NOT: { createdById: userId } },
      include: {
        supports: true,
        createdBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reports.map((report) => this.formatReportResponse(report, userId));
  }

  async getReportById(id: string, currentUserId: string) {
    const report = await this.prisma.civicReport.findUnique({
      where: { id },
      include: {
        supports: true,
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    if (!report) throw new NotFoundException('Report not found');

    return this.formatReportResponse(report, currentUserId);
  }

  async supportReport(reportId: string, userId: string) {
    const report = await this.prisma.civicReport.findUnique({
      where: { id: reportId },
    });

    if (!report) throw new NotFoundException('Report not found');
    if (report.createdById === userId) {
      throw new ForbiddenException('Cannot vote on your own report');
    }

    const existing = await this.prisma.civicReportSupport.findUnique({
      where: { reportId_userId: { reportId, userId } }, // ✅ Correct usage
    });

    if (existing) {
      throw new BadRequestException('You have already voted on this report');
    }

    const support = await this.prisma.civicReportSupport.create({
      data: { reportId, userId, support: true },
    });

    await this.prisma.civicReport.update({
      where: { id: reportId },
      data: { supportCount: { increment: 1 } },
    });

    await this.checkThreshold(reportId);
    return support;
  }

  async opposeReport(reportId: string, userId: string) {
    const report = await this.prisma.civicReport.findUnique({
      where: { id: reportId },
    });

    if (!report) throw new NotFoundException('Report not found');
    if (report.createdById === userId) {
      throw new ForbiddenException('Cannot vote on your own report');
    }

    const existing = await this.prisma.civicReportSupport.findUnique({
      where: { reportId_userId: { reportId, userId } }, // ✅ Correct usage
    });

    if (existing) {
      throw new BadRequestException('You have already voted on this report');
    }

    const oppose = await this.prisma.civicReportSupport.create({
      data: { reportId, userId, support: false },
    });

    await this.prisma.civicReport.update({
      where: { id: reportId },
      data: { oppositionCount: { increment: 1 } },
    });

    await this.checkThreshold(reportId);
    return oppose;
  }

  private formatReportResponse(report: any, currentUserId: string) {
    const userVote = report.supports?.find(
      (s: any) => s.userId === currentUserId,
    );

    return {
      ...report,
      isOwnReport: report.createdById === currentUserId,
      userVote: userVote ? (userVote.support ? 'support' : 'oppose') : null,
      hasVoted: !!userVote,
      canVote: report.createdById !== currentUserId && !userVote,
    };
  }

  private async checkThreshold(reportId: string) {
    const supportCount = await this.prisma.civicReportSupport.count({
      where: { reportId, support: true },
    });

    const threshold = 5; // ⚡ configurable if needed
    if (supportCount >= threshold) {
      const updated = await this.prisma.civicReport.update({
        where: { id: reportId },
        data: { status: ReportStatus.escalated }, // Use enum constant
      });

      const admins = await this.prisma.user.findMany({ where: { role: Role.ADMIN } });
      await this.prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          reportId,
          message: `Report ${updated.title} has reached support threshold and needs review.`,
        })),
        skipDuplicates: true,
      });
    }
  }

  async assignToNearestWorker(reportId: string) {
    const report = await this.prisma.civicReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');

    // Allow assignment only for cleaning/pickup related issues
    const infraTypes: ReportType[] = [
      ReportType.public_bin_request,
      ReportType.public_toilet_request,
    ];
    if (infraTypes.includes(report.type)) {
      throw new BadRequestException('This is an infrastructure request; handle via admin resolution.');
    }

    const workerLocations = await this.prisma.wasteWorkerLocation.findMany({
      include: { worker: true },
    });
    if (workerLocations.length === 0) throw new BadRequestException('No workers available');

    const nearest = workerLocations
      .map((wl) => ({
        wl,
        dist: Math.hypot(wl.latitude - report.latitude, wl.longitude - report.longitude),
      }))
      .sort((a, b) => a.dist - b.dist)[0].wl;

    const updated = await this.prisma.civicReport.update({
      where: { id: reportId },
      data: { assignedToWorkerId: nearest.workerId, status: ReportStatus.assigned },
      include: { createdBy: true },
    });

    // Notify the assigned worker
    await this.prisma.notification.create({
      data: {
        userId: nearest.workerId,
        reportId: reportId,
        message: `A report has been assigned to you: ${updated.title}`,
      },
    });

    // Notify the citizen who created the report
    await this.prisma.notification.create({
      data: {
        userId: updated.createdById,
        reportId: reportId,
        message: `Your report "${updated.title}" has been assigned to a worker and is being processed.`,
      },
    });

    return updated;
  }

  async workerUploadResolution(reportId: string, workerId: string, imageUrl: string, notes?: string) {
    const report = await this.prisma.civicReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');
    if (report.assignedToWorkerId !== workerId) throw new ForbiddenException('Not assigned to you');

    const updated = await this.prisma.civicReport.update({
      where: { id: reportId },
      data: { resolvedImageUrl: imageUrl, resolvedNotes: notes ?? null }, // Changed undefined to null for safety
      include: { createdBy: true },
    });

    const admins = await this.prisma.user.findMany({ where: { role: Role.ADMIN } });
    await this.prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        reportId,
        message: `Worker uploaded resolution evidence for: ${updated.title}`,
      })),
      skipDuplicates: true,
    });

    return updated;
  }

  // 👇 FIX: This method now updates status and returns the report
  async workerMarkResolved(reportId: string, workerId: string) {
    const report = await this.prisma.civicReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');
    if (report.assignedToWorkerId !== workerId) throw new ForbiddenException('Not assigned to you');
    if (!report.resolvedImageUrl) throw new BadRequestException('Upload resolution photo first');

    // Update status to 'escalated' to signal Admin review, if it's currently 'assigned'
    let updatedReport = report;
    if (report.status === ReportStatus.assigned) {
        updatedReport = await this.prisma.civicReport.update({
            where: { id: reportId },
            data: { 
                status: ReportStatus.escalated, // Using escalated as a 'ready for review' status
            },
            include: { createdBy: true },
        });
    }

    const admins = await this.prisma.user.findMany({ where: { role: Role.ADMIN } });
    await this.prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        reportId,
        message: `🚨 Worker finished report: ${updatedReport.title}. Requires Admin Confirmation.`,
      })),
      skipDuplicates: true,
    });
    
    return updatedReport;
  }
  
  // 👇 FIX: This method now correctly implements admin confirmation logic
  async adminConfirmResolution(reportId: string, adminId: string) {
    // 1. Fetch the report to get the creator's ID for notification
    const report = await this.prisma.civicReport.findUnique({ 
      where: { id: reportId },
      select: { id: true, title: true, createdById: true, status: true },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status === ReportStatus.resolved) {
        throw new BadRequestException('Report is already officially resolved.');
    }

    // 2. Update the report status to 'resolved' and record the Admin who confirmed it
    // NOTE: Your schema doesn't seem to have adminConfirmedAt/adminConfirmedById, 
    // but the final status change is the crucial step.
    const updated = await this.prisma.civicReport.update({
      where: { id: reportId },
      data: { 
          status: ReportStatus.resolved, // FINAL STATUS
          // data: { adminConfirmedAt: new Date(), adminConfirmedById: adminId } // Add these fields to schema for auditing
      },
      include: { createdBy: true },
    });

    // 3. Notify the Citizen who reported the issue
    await this.prisma.notification.create({
      data: {
        userId: updated.createdById, // Use the original citizen's ID
        reportId,
        message: `✅ Your report "${updated.title}" has been officially RESOLVED and confirmed by the administration. Thank you!`,
      },
    });

    return updated;
  }
  
  // ... (rest of the methods)
  
  async getAssignedToWorker(workerId: string) {
    const reports = await this.prisma.civicReport.findMany({
      where: { assignedToWorkerId: workerId },
      orderBy: { createdAt: 'desc' },
    });
    return reports;
  }

  async adminStartWorking(reportId: string, adminId: string) {
    const report = await this.prisma.civicReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');

    const infraTypes: ReportType[] = [
      ReportType.public_bin_request,
      ReportType.public_toilet_request,
    ];
    if (!infraTypes.includes(report.type)) {
      throw new BadRequestException('Only infrastructure requests can be marked as working without assignment');
    }

    const updated = await this.prisma.civicReport.update({
      where: { id: reportId },
      data: { status: ReportStatus.working }, // ✅ FIX: Use 'working' status instead of 'assigned'
      include: { createdBy: true },
    });

    await this.prisma.notification.create({
      data: {
        userId: updated.createdById,
        reportId,
        message: `Your infrastructure request is being worked on: ${updated.title}`,
      },
    });

    return updated;
  }

  async getNotifications(userId: string) {
    // Return recent notifications (both read and unread) for better UX
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Increased limit to show more history
    });
  }

  async markNotificationRead(notificationId: string, userId: string) {
    const notif = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notif || notif.userId !== userId) throw new ForbiddenException('Not allowed');
    return this.prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
  }
}
