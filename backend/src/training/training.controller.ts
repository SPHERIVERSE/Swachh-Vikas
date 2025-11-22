import { 
  Controller, Post, Body, Get, Query, Delete, Param, Put, UseGuards 
} from '@nestjs/common';
import { TrainingService } from './training.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role, QuestionType } from '@prisma/client';
import { AuthUser } from '../auth/auth-user.decorator';

@Controller('training')
@UseGuards(JwtAuthGuard)
export class TrainingController {
  constructor(private trainingService: TrainingService) {}

  // ------------------ MODULES ------------------
  @Post('modules')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async createModule(@Body() dto: { title: string; role: Role }) {
    return this.trainingService.createModule(dto.title, dto.role);
  }

  @Get('modules')
async getModules(@Query('role') role?: Role, @AuthUser() user?: any) {
  let fetchRole: Role | undefined;

  if (user.role === Role.ADMIN) {
    // Admin can optionally filter by role, otherwise fetch all
    fetchRole = role;
  } else {
    // Citizen/Worker can only fetch their own modules
    fetchRole = user.role;
  }

  return this.trainingService.getModules(fetchRole, user?.sub);
}

  @Get('modules/:id')
  async getModule(@Param('id') id: string, @AuthUser() user?: any) {
    return this.trainingService.getModuleById(id, user?.sub);
  }

  @Delete('modules/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async deleteModule(@Param('id') id: string) {
    return this.trainingService.deleteModule(id);
  }

  // ------------------ USER PROGRESS ------------------
  @Get('modules/:moduleId/progress')
  async getModuleProgress(@Param('moduleId') moduleId: string, @AuthUser() user: any) {
    return this.trainingService.getModuleProgress(user.sub, moduleId);
  }

  @Post('progress')
  async recordProgress(
    @AuthUser() user: any,
    @Body() dto: { moduleId: string; type: string; itemId: string; status: string; xp?: number; score?: number },
  ) {
    return this.trainingService.recordProgress(
      user.sub,
      dto.moduleId,
      dto.type,
      dto.itemId,
      dto.status,
      dto.xp,
      dto.score,
    );
  }

  // ------------------ USER OVERALL PROGRESS ------------------
  @Get('user/progress')
  async getUserProgress(@AuthUser() user: any) {
    return this.trainingService.getUserOverallProgress(user.sub, user.role);
  }

  // ------------------ FLASHCARDS ------------------
  @Post('flashcards')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async addFlashcard(@Body() dto: { moduleId: string; question: string; answer: string }) {
    return this.trainingService.addFlashcard(dto.moduleId, dto.question, dto.answer);
  }

  @Put('flashcards/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateFlashcard(@Param('id') id: string, @Body() dto: { question: string; answer: string }) {
    return this.trainingService.updateFlashcard(id, dto.question, dto.answer);
  }

  @Delete('flashcards/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async deleteFlashcard(@Param('id') id: string) {
    return this.trainingService.deleteFlashcard(id);
  }

  // ------------------ VIDEOS ------------------
  @Post('videos')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async addVideo(@Body() dto: { moduleId: string; title: string; url: string }) {
    return this.trainingService.addVideo(dto.moduleId, dto.title, dto.url);
  }

  @Put('videos/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateVideo(@Param('id') id: string, @Body() dto: { title: string; url: string }) {
    return this.trainingService.updateVideo(id, dto.title, dto.url);
  }

  @Delete('videos/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async deleteVideo(@Param('id') id: string) {
    return this.trainingService.deleteVideo(id);
  }

  // ------------------ QUIZZES ------------------
  @Post('quizzes')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async addQuiz(@Body() dto: { moduleId: string; title: string }) {
    return this.trainingService.addQuiz(dto.moduleId, dto.title);
  }

  @Delete('quizzes/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async deleteQuiz(@Param('id') id: string) {
    return this.trainingService.deleteQuiz(id);
  }

  // ------------------ QUIZ QUESTIONS ------------------
  @Post('questions')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async addQuizQuestion(
    @Body() dto: {
      quizId: string;
      type: QuestionType;
      question: string;
      answer?: string;
      options?: { text: string; isCorrect: boolean }[];
    },
  ) {
    return this.trainingService.addQuizQuestion(dto.quizId, dto.type, dto.question, dto.answer, dto.options);
  }

  @Delete('questions/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async deleteQuizQuestion(@Param('id') id: string) {
    return this.trainingService.deleteQuizQuestion(id);
  }

  // ------------------ QUIZ OPTIONS ------------------
  @Post('options')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async addQuizOption(@Body() dto: { questionId: string; text: string; isCorrect: boolean }) {
    return this.trainingService.addQuizOption(dto.questionId, dto.text, dto.isCorrect);
  }

  @Delete('options/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async deleteQuizOption(@Param('id') id: string) {
    return this.trainingService.deleteQuizOption(id);
  }
  
// ------------------ LEADERBOARD ------------------
@Get('leaderboard')
async getLeaderboard(
  @Query('limit') limit?: string,
  @Query('role') role?: Role,
) {
  const parsedLimit = limit ? parseInt(limit, 10) : 10;
  return this.trainingService.getLeaderboard(parsedLimit, role);
}

@Get('leaderboard/me')
async getMyRank(@AuthUser() user: any) {
  return this.trainingService.getMyRank(user.sub, user.role);
}

}
