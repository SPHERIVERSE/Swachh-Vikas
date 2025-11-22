import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

  // ✅ Create a new course (mandatory or miscellaneous)
  async createCourse(
    title: string,
    description: string,
    isMandatory: boolean,
    role: Role,
    moduleIds?: string[]
  ) {
    const course = await this.prisma.course.create({
      data: {
        title,
        description,
        isMandatory,
        role,
      },
    });

    // If modules are provided, link them to the course
    if (moduleIds && moduleIds.length > 0) {
      await this.prisma.trainingModule.updateMany({
        where: { id: { in: moduleIds } },
        data: { 
          courseId: course.id,
          courseType: isMandatory ? 'MANDATORY' : 'MISCELLANEOUS',
          isMandatory 
        },
      });
    }

    return course;
  }

  // ✅ Get all courses for a role
  async getCourses(role: Role, userId?: string) {
    const courses = await this.prisma.course.findMany({
      where: { role },
      include: {
        modules: {
          include: {
            userProgress: userId ? { where: { userId } } : undefined,
          },
        },
        completions: userId ? { where: { userId } } : undefined,
      },
    });

    return courses.map(course => ({
      ...course,
      userProgress: userId ? course.modules.flatMap(m => m.userProgress || []) : undefined,
      isCompleted: userId ? course.completions.length > 0 : false,
      completionDate: userId && course.completions.length > 0 ? course.completions[0].completedAt : null,
      certificateUrl: userId && course.completions.length > 0 ? course.completions[0].certificateUrl : null,
    }));
  }

  // ✅ Get mandatory courses for a user
  async getMandatoryCourses(userId: string, role: Role) {
    return this.getCourses(role, userId).then(courses => 
      courses.filter(course => course.isMandatory)
    );
  }

  // ✅ Get miscellaneous courses for a user
  async getMiscellaneousCourses(userId: string, role: Role) {
    return this.getCourses(role, userId).then(courses => 
      courses.filter(course => !course.isMandatory)
    );
  }

  // ✅ Check if user has completed all mandatory courses
  async checkMandatoryCourseCompletion(userId: string, role: Role) {
    const mandatoryCourses = await this.getMandatoryCourses(userId, role);
    const completedMandatory = mandatoryCourses.filter(course => course.isCompleted);
    
    return {
      totalMandatory: mandatoryCourses.length,
      completedMandatory: completedMandatory.length,
      isAllCompleted: mandatoryCourses.length === completedMandatory.length,
      incompleteCourses: mandatoryCourses.filter(course => !course.isCompleted),
    };
  }

  // ✅ Complete a course and generate certificate
  async completeCourse(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { modules: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check if all modules are completed
    const completedModules = await this.prisma.userModuleProgress.count({
      where: {
        userId,
        moduleId: { in: course.modules.map(m => m.id) },
        completed: true,
      },
    });

    if (completedModules !== course.modules.length) {
      throw new BadRequestException('All modules must be completed before course completion');
    }

    // Check if already completed
    const existingCompletion = await this.prisma.courseCompletion.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (existingCompletion) {
      return existingCompletion;
    }

    // Generate certificate URL (you can implement actual certificate generation here)
    const certificateUrl = await this.generateCertificate(userId, course);

    // Create completion record
    const completion = await this.prisma.courseCompletion.create({
      data: {
        userId,
        courseId,
        certificateUrl,
      },
      include: {
        course: true,
        user: true,
      },
    });

    return completion;
  }

  // ✅ Generate certificate (placeholder - implement actual certificate generation)
  private async generateCertificate(userId: string, course: any): Promise<string> {
    // This is a placeholder - you can implement actual certificate generation
    // using libraries like PDFKit, Puppeteer, or external services
    const certificateId = `cert_${userId}_${course.id}_${Date.now()}`;
    return `/certificates/${certificateId}.pdf`;
  }

  // ✅ Get user's certificates
  async getUserCertificates(userId: string) {
    return this.prisma.courseCompletion.findMany({
      where: { userId },
      include: {
        course: true,
      },
      orderBy: { completedAt: 'desc' },
    });
  }

  // ✅ Update course
  async updateCourse(courseId: string, updateData: any) {
    return this.prisma.course.update({
      where: { id: courseId },
      data: updateData,
    });
  }

  // ✅ Delete course
  async deleteCourse(courseId: string) {
    // First, unlink modules from course
    await this.prisma.trainingModule.updateMany({
      where: { courseId },
      data: { courseId: null, courseType: 'MISCELLANEOUS', isMandatory: false },
    });

    // Delete course completions
    await this.prisma.courseCompletion.deleteMany({
      where: { courseId },
    });

    // Delete the course
    return this.prisma.course.delete({
      where: { id: courseId },
    });
  }

  // ✅ Add modules to course
  async addModulesToCourse(courseId: string, moduleIds: string[]) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.prisma.trainingModule.updateMany({
      where: { id: { in: moduleIds } },
      data: {
        courseId,
        courseType: course.isMandatory ? 'MANDATORY' : 'MISCELLANEOUS',
        isMandatory: course.isMandatory,
      },
    });
  }

  // ✅ Remove modules from course
  async removeModulesFromCourse(courseId: string, moduleIds: string[]) {
    return this.prisma.trainingModule.updateMany({
      where: { id: { in: moduleIds } },
      data: {
        courseId: null,
        courseType: 'MISCELLANEOUS',
        isMandatory: false,
      },
    });
  }
}





