import { Module, forwardRef } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CleanCoinModule } from '../cleancoin/cleancoin.module';

@Module({
  imports: [PrismaModule, AuthModule, forwardRef(() => CleanCoinModule)],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}


