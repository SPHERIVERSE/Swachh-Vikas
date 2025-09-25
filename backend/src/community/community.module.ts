import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}



