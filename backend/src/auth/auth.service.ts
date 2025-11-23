// src/auth/auth.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  // 🔹 Register with default CITIZEN role
  async registerLocal(
    email: string,
    password: string,
    name: string,
    phone: string,
    role: string = 'CITIZEN',
    businessData?: {
      licenseNo?: string;
      businessType?: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
    }
  ) {
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new BadRequestException('Email already exists');
      }
      if (existingUser.phone === phone) {
        throw new BadRequestException('Phone already exists');
      }
    }

    const hash = await bcrypt.hash(password, 10);

    // ✅ Convert string to Prisma enum Role
    const prismaRole: Role = role as Role;

    const userData: any = {
      email,
      password: hash,
      name,
      phone,
      role: prismaRole,
    };

    // Add business-specific fields if role is BUSINESS
    if (role === 'BUSINESS' && businessData) {
      userData.licenseNo = businessData.licenseNo || null;
      userData.businessType = businessData.businessType || null;
      userData.address = businessData.address || null;
      userData.city = businessData.city || null;
      userData.state = businessData.state || null;
      userData.pincode = businessData.pincode || null;
    }

    return this.prisma.user.create({
      data: userData,
    });
  }


  // 🔹 Login includes role in JWT
  async loginLocal(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return { access_token: this.jwt.sign(payload), role: user.role };
  }

  async verifyLocalToken(token: string) {
    return this.jwt.verify(token, { secret: process.env.NEST_JWT_SECRET });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}

