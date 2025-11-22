import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards,
  Query 
} from '@nestjs/common';
import { CourseService } from './course.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../auth/auth-user.decorator';
import { Role } from '@prisma/client';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  // ✅ Create course (Admin only)
  @Post()
  @Roles(Role.ADMIN)
  async createCourse(
    @Body() body: {
      title: string;
      description: string;
      isMandatory: boolean;
      role: Role;
      moduleIds?: string[];
    }
  ) {
    return this.courseService.createCourse(
      body.title,
      body.description,
      body.isMandatory,
      body.role,
      body.moduleIds
    );
  }

  // ✅ Get all courses for user's role
  @Get()
  async getCourses(
    @AuthUser('role') role: Role,
    @AuthUser('sub') userId: string
  ) {
    return this.courseService.getCourses(role, userId);
  }

  // ✅ Get mandatory courses
  @Get('mandatory')
  async getMandatoryCourses(
    @AuthUser('role') role: Role,
    @AuthUser('sub') userId: string
  ) {
    return this.courseService.getMandatoryCourses(userId, role);
  }

  // ✅ Get miscellaneous courses
  @Get('miscellaneous')
  async getMiscellaneousCourses(
    @AuthUser('role') role: Role,
    @AuthUser('sub') userId: string
  ) {
    return this.courseService.getMiscellaneousCourses(userId, role);
  }

  // ✅ Check mandatory course completion status
  @Get('mandatory/status')
  async checkMandatoryCompletion(
    @AuthUser('role') role: Role,
    @AuthUser('sub') userId: string
  ) {
    return this.courseService.checkMandatoryCourseCompletion(userId, role);
  }

  // ✅ Complete a course
  @Post(':courseId/complete')
  async completeCourse(
    @Param('courseId') courseId: string,
    @AuthUser('sub') userId: string
  ) {
    return this.courseService.completeCourse(userId, courseId);
  }

  // ✅ Get user's certificates
  @Get('certificates')
  async getUserCertificates(@AuthUser('sub') userId: string) {
    return this.courseService.getUserCertificates(userId);
  }

  // ✅ Update course (Admin only)
  @Put(':courseId')
  @Roles(Role.ADMIN)
  async updateCourse(
    @Param('courseId') courseId: string,
    @Body() updateData: any
  ) {
    return this.courseService.updateCourse(courseId, updateData);
  }

  // ✅ Delete course (Admin only)
  @Delete(':courseId')
  @Roles(Role.ADMIN)
  async deleteCourse(@Param('courseId') courseId: string) {
    return this.courseService.deleteCourse(courseId);
  }

  // ✅ Add modules to course (Admin only)
  @Post(':courseId/modules')
  @Roles(Role.ADMIN)
  async addModulesToCourse(
    @Param('courseId') courseId: string,
    @Body() body: { moduleIds: string[] }
  ) {
    return this.courseService.addModulesToCourse(courseId, body.moduleIds);
  }

  // ✅ Remove modules from course (Admin only)
  @Delete(':courseId/modules')
  @Roles(Role.ADMIN)
  async removeModulesFromCourse(
    @Param('courseId') courseId: string,
    @Body() body: { moduleIds: string[] }
  ) {
    return this.courseService.removeModulesFromCourse(courseId, body.moduleIds);
  }

  // ✅ Get course details (Admin only)
  @Get(':courseId')
  @Roles(Role.ADMIN)
  async getCourseDetails(@Param('courseId') courseId: string) {
    return this.courseService.getCourses(Role.CITIZEN).then(courses => 
      courses.find(course => course.id === courseId)
    );
  }
}





