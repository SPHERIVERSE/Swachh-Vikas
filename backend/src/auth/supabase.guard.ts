// src/auth/supabase.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers['authorization'];
    if (!authHeader) throw new UnauthorizedException('Missing Authorization header');

    const parts = (authHeader as string).split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer')
      throw new UnauthorizedException('Invalid Authorization header');

    const token = parts[1];
    try {
      // decode user from JWT token
      const user = await this.supabase.getUserFromToken(token);
      if (!user) throw new UnauthorizedException('Invalid Supabase token');

      // attach user to request
      (req as any).user = user;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired Supabase token');
    }
  }
}

