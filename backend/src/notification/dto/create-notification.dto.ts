// src/notification/dto/create-notification.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  userId: string; 

  @IsString()
  @IsNotEmpty()
  message: string;

  // ✅ FIX: Now optional, matching the nullable column in Prisma schema
  @IsString()
  @IsOptional() 
  reportId?: string; 

  // ✅ ADDED: Notification type field, also optional
  @IsString()
  @IsOptional()
  @IsIn(['CIVIC_REPORT_STATUS', 'BID_ACCEPTED', 'OTHER']) // Ensure this matches your Prisma enum
  type?: 'CIVIC_REPORT_STATUS' | 'BID_ACCEPTED' | 'OTHER';

  @IsBoolean()
  @IsOptional()
  isRead?: boolean = false;
}
