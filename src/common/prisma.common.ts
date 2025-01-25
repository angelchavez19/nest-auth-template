import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/providers/prisma/prisma';

export interface ExistingUserI {
  id: number;
  email: string;
  isEmailVerified: boolean;
  password: string;
  firstName: string;
  lastName: string;
  roleId: number;
  role: {
    name: string;
  };
  twoFactorSecret: string | null;
  twoFactorIV: string | null;
  twoFactorEnabled: boolean;
}

@Injectable()
export class PrismaCommonService {
  constructor(private prisma: PrismaService) {}

  selectExistingUser = {
    id: true,
    email: true,
    isEmailVerified: true,
    password: true,
    firstName: true,
    lastName: true,
    provider: true,
    roleId: true,
    role: {
      select: { name: true },
    },
    twoFactorSecret: true,
    twoFactorIV: true,
    twoFactorEnabled: true,
  };

  getExistingUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      select: this.selectExistingUser,
      where: { email },
    });
  }

  getExistingUserByToken(token: string) {
    return this.prisma.user.findUnique({ where: { token } });
  }

  getExistingUserById(id: number) {
    return this.prisma.user.findUnique({
      select: this.selectExistingUser,
      where: { id },
    });
  }
}
