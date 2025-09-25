import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('users')
export class UserController {
  @UseGuards(SupabaseAuthGuard)
  @Get('me')
  getProfile(@Req() req) {
    return { user: req.user };
  }
}
