import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from './supabase.guard';
import { LocalAuthGuard } from './local-auth.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

type RoleType = 'ADMIN' | 'WORKER' | 'CITIZEN';

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private supabase: SupabaseService,
    private prisma: PrismaService,
  ) {}

  // 🔹 Register new user
  @Post('register')
  async register(
    @Body()
    dto: { email: string; password: string; name: string; phone: string; role?: RoleType },
  ) {
    const allowedRoles: RoleType[] = ['ADMIN', 'WORKER', 'CITIZEN'];
    const role = allowedRoles.includes(dto.role as RoleType) ? dto.role! : 'CITIZEN';

    return this.auth.registerLocal(dto.email, dto.password, dto.name, dto.phone, role);
  }

  // 🔹 Local login
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req) {
    return this.auth.loginLocal(req.user);
  }

  // 🔹 Check logged-in local user
  @UseGuards(JwtAuthGuard)
  @Post('check')
  getLocalUser(@Req() req) {
    return { user: req.user };
  }

  // 🔹 Send OTP (for registration or forgot-password)
  @Post('send-otp')
  async sendOtp(@Body() dto: { phone: string }) {
    return this.supabase.sendOtp(dto.phone);
  }

  // 🔹 Verify OTP
  @Post('verify-otp')
  async verifyOtp(@Body() dto: { phone: string; token: string }) {
    const response = await this.supabase.verifyOtp(dto.phone, dto.token);

    if (!response.session) {
      return { success: false, message: 'OTP verification failed' };
    }

    return {
      success: true,
      message: 'OTP verified successfully',
      supabaseUser: response.session.user || null,
      accessToken: response.session.access_token,
    };
  }

  // 🔹 Reset password
  @Post('reset-password')
  async resetPassword(@Body() dto: { phone: string; newPassword: string }) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) throw new NotFoundException('User not found');

    const hash = await bcrypt.hash(dto.newPassword, 10);
    return this.prisma.user.update({ where: { phone: dto.phone }, data: { password: hash } });
  }

  // 🔹 Supabase-protected test route
  @UseGuards(SupabaseAuthGuard)
  @Post('supabase-check')
  getSupabaseUser(@Req() req) {
    return { supabaseUser: req.user };
  }

  // 🔹 Protected route: only ADMIN
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin-dashboard')
  getAdminData(@Req() req) {
    return { message: `Welcome Admin ${req.user.email}`, user: req.user };
  }

  // 🔹 Protected route: only WORKER
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  @Post('worker-dashboard')
  getWorkerData(@Req() req) {
    return { message: `Welcome Worker ${req.user.email}`, user: req.user };
  }
}

