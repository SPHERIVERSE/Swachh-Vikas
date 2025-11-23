// backend/src/civic-report/civic-report.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { CivicReportService } from './civic-report.service';
import { CivicReportController } from './civic-report.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CleanCoinModule } from '../cleancoin/cleancoin.module';

@Module({
  imports: [PrismaModule, AuthModule, forwardRef(() => CleanCoinModule)],
  providers: [CivicReportService],
  controllers: [CivicReportController],
})
export class CivicReportModule {}
