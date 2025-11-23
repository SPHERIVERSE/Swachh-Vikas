import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BusinessService } from './business.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../auth/auth-user.decorator';

@Controller('business')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  // CSR Funds
  @Post('csr-funds')
  @Roles('BUSINESS')
  async createCSRFund(@AuthUser('sub') businessId: string, @Body() body: any) {
    return this.businessService.createCSRFund(businessId, body);
  }

  @Get('csr-funds')
  @Roles('BUSINESS')
  async getCSRFunds(@AuthUser('sub') businessId: string) {
    return this.businessService.getCSRFunds(businessId);
  }

  // Admin endpoint to view all CSR funds
  @Get('csr-funds/all')
  @Roles('ADMIN')
  async getAllCSRFunds() {
    return this.businessService.getAllCSRFunds();
  }

  @Post('csr-funds/:fundId/allocate')
  @Roles('BUSINESS')
  async allocateCSRFund(
    @Param('fundId') fundId: string,
    @AuthUser('sub') businessId: string,
    @Body() body: any,
  ) {
    return this.businessService.allocateCSRFund(fundId, businessId, body);
  }

  // Community Drives
  @Post('drives')
  @Roles('BUSINESS')
  async createCommunityDrive(@AuthUser('sub') businessId: string, @Body() body: any) {
    return this.businessService.createCommunityDrive(businessId, {
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    });
  }

  @Get('drives')
  @Roles('BUSINESS')
  async getCommunityDrives(@AuthUser('sub') businessId: string) {
    return this.businessService.getCommunityDrives(businessId);
  }

  // Awareness Quizzes
  @Post('quizzes')
  @Roles('BUSINESS')
  async createAwarenessQuiz(@AuthUser('sub') businessId: string, @Body() body: any) {
    return this.businessService.createAwarenessQuiz(businessId, {
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    });
  }

  @Post('quizzes/:quizId/activate')
  @Roles('BUSINESS')
  async activateQuiz(@Param('quizId') quizId: string, @AuthUser('sub') businessId: string) {
    return this.businessService.activateQuiz(quizId, businessId);
  }

  @Get('quizzes')
  @Roles('BUSINESS')
  async getAwarenessQuizzes(@AuthUser('sub') businessId: string) {
    return this.businessService.getAwarenessQuizzes(businessId);
  }

  // Public endpoints for citizens/workers
  @Get('quizzes/active')
  async getActiveQuizzes(@Query('role') role?: string) {
    return this.businessService.getActiveQuizzes(role as any);
  }

  @Get('quizzes/:quizId/my-participation')
  async getMyParticipation(
    @Param('quizId') quizId: string,
    @AuthUser('sub') userId: string,
  ) {
    const count = await this.businessService.getQuizParticipationCount(quizId, userId);
    return { attempts: count };
  }

  @Post('quizzes/:quizId/participate')
  async submitQuizParticipation(
    @Param('quizId') quizId: string,
    @AuthUser('sub') userId: string,
    @Body() body: any,
  ) {
    return this.businessService.submitQuizParticipation(quizId, userId, body);
  }
}


