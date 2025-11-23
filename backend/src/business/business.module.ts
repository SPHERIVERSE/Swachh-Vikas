import { Module, forwardRef } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CleanCoinModule } from '../cleancoin/cleancoin.module';

@Module({
  imports: [PrismaModule, AuthModule, forwardRef(() => CleanCoinModule)],
  controllers: [BusinessController],
  providers: [BusinessService],
  exports: [BusinessService],
})
export class BusinessModule {}


