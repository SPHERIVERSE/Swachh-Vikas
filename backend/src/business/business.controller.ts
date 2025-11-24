import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BusinessService } from './business.service';

import { CreateCsrFundDto } from './dto/create-csr-fund.dto';
import { AllocateCsrFundDto } from './dto/allocate-csr-fund.dto';
import { CreateCommunityDriveDto } from './dto/create-community-drive.dto';
import { CreateAwarenessQuizDto } from './dto/create-awareness-quiz.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { AuthUser } from '../auth/auth-user.decorator';

@Controller('business')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  // ==================== CSR FUNDS ====================
  
  // CREATE CSR FUND
  @Post('csr-funds')
  @Roles(Role.BUSINESS)
  async createFund(@AuthUser('sub') businessId: string, @Body() dto: CreateCsrFundDto) {
    return this.businessService.createCSRFund(businessId, dto);
  }

  // GET CSR FUNDS
  @Get('csr-funds')
  @Roles(Role.BUSINESS)
  async getFunds(@AuthUser('sub') businessId: string) {
    return this.businessService.getFunds(businessId);
  }

  // ALLOCATE FUND
  @Post('csr-funds/:fundId/allocate')
  @Roles(Role.BUSINESS)
  async allocate(
    @AuthUser('sub') businessId: string,
    @Param('fundId') fundId: string,
    @Body() dto: AllocateCsrFundDto,
  ) {
    return this.businessService.allocateCSRFund(fundId, businessId, dto);
  }

  // Admin endpoint to view all CSR funds
  @Get('csr-funds/all')
  @Roles(Role.ADMIN)
  async getAllCSRFunds() {
    return this.businessService.getAllCSRFunds();
  }

  // ==================== COMMUNITY DRIVES ====================
  
  // CREATE COMMUNITY DRIVE
  @Post('drives')
  @Roles(Role.BUSINESS)
  async createDrive(@AuthUser('sub') businessId: string, @Body() dto: CreateCommunityDriveDto) {
    return this.businessService.createDrive(businessId, {
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    });
  }

  // GET COMMUNITY DRIVES
  @Get('drives')
  @Roles(Role.BUSINESS)
  async getDrives(@AuthUser('sub') businessId: string) {
    return this.businessService.getCommunityDrives(businessId);
  }

  // ==================== AWARENESS QUIZZES ====================
  
  // CREATE AWARENESS QUIZ (using /quizzes endpoint to match frontend)
  @Post('quizzes')
  @Roles(Role.BUSINESS)
  async createQuiz(@AuthUser('sub') businessId: string, @Body() body: any) {
    return this.businessService.createAwarenessQuiz(businessId, {
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    });
  }

  // GET AWARENESS QUIZZES (using /quizzes endpoint to match frontend)
  @Get('quizzes')
  @Roles(Role.BUSINESS)
  async getQuizzes(@AuthUser('sub') businessId: string) {
    return this.businessService.getAwarenessQuizzes(businessId);
  }

  // ACTIVATE QUIZ
  @Post('quizzes/:quizId/activate')
  @Roles(Role.BUSINESS)
  async activateQuiz(@Param('quizId') quizId: string, @AuthUser('sub') businessId: string) {
    return this.businessService.activateQuiz(quizId, businessId);
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

