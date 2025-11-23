import { Module, forwardRef } from '@nestjs/common';
import { TrainingService } from './training.service';
import { TrainingController } from './training.controller';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CleanCoinModule } from '../cleancoin/cleancoin.module';

@Module({
  imports: [PrismaModule, AuthModule, forwardRef(() => CleanCoinModule)],
  controllers: [TrainingController, CourseController],
  providers: [TrainingService, CourseService],
  exports: [TrainingService, CourseService],
})
export class TrainingModule {}

