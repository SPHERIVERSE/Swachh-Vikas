import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { SupabaseModule } from './supabase/supabase.module';
import { TrainingModule } from './training/training.module';
import { CivicReportModule } from './civic-report/civic-report.module';
import { MapsModule } from './maps/maps.module';
import { APP_PIPE } from '@nestjs/core';
import { CommunityModule } from './community/community.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { BusinessModule } from './business/business.module';
import { GeminiModule } from './gemini/gemini.module';
import { NotificationModule } from './notification/notification.module';
import { CleanCoinModule } from './cleancoin/cleancoin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UserModule,
    AuthModule,
    SupabaseModule,
    TrainingModule,
    CivicReportModule,
    MapsModule,
    CommunityModule,
    MarketplaceModule,
    BusinessModule,
    GeminiModule,
    NotificationModule,
    CleanCoinModule,
  ],
  controllers: [], // Ensure this is not missing if you have no global controllers
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    },
  ],
})
export class AppModule {}
