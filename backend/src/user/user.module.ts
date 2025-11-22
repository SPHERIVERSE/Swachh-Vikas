// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SupabaseModule } from '../supabase/supabase.module'; 
import { AuthModule } from '../auth/auth.module'; 

@Module({
  imports: [
    SupabaseModule,
    AuthModule,
  ], // ✅ add here
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
