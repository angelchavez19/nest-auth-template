import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/providers/prisma/prisma';
import { JWTUserPayloadI } from 'src/types/jwt.type';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getInfoUser(user: JWTUserPayloadI) {
    if (!user) {
      throw new HttpException('User not authenticated', HttpStatus.FORBIDDEN);
    }

    return await this.prisma.user.findUnique({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        email: true,
        provider: true,
        createdAt: true,
        dateOfBirth: true,
        role: {
          select: {
            name: true,
            permissions: {
              select: {
                permission: {
                  select: {
                    name: true,
                    route: true,
                  },
                },
              },
            },
          },
        },
        isActive: true,
        isSuperAdmin: true,
        lastLogin: true,
        updatedAt: true,
        language: true,
        theme: true,
        twoFactorEnabled: true,
      },
      where: { id: user.id },
    });
  }
}
