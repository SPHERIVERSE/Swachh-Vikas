import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; 


@Module({
  imports: [
  	PrismaModule,
  	AuthModule,
  ], // Required for NotificationService to access PrismaService
  controllers: [NotificationController],
  providers: [NotificationService],
  // Export the service so it can be injected into other modules 
  // (e.g., CivicReportModule, MarketplaceModule) to CREATE notifications
  exports: [NotificationService], 
})
export class NotificationModule {}
