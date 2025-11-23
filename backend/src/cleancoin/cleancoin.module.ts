import { Module, forwardRef } from '@nestjs/common';
import { CleanCoinService } from './cleancoin.service';
import { CleanCoinController } from './cleancoin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [CleanCoinService],
  controllers: [CleanCoinController],
  exports: [CleanCoinService],
})
export class CleanCoinModule {}

