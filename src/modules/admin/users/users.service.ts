import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/providers/prisma/prisma';

interface UserI {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
  dateOfBirth: Date;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin: Date;
  updatedAt: Date;
  role: {
    name: string;
  };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  parseUser(user: UserI) {
    return {
      ...user,
      role: user.role.name,
    };
  }

  async findAll() {
    const users: UserI[] = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        dateOfBirth: true,
        role: { select: { name: true } },
        isActive: true,
        isEmailVerified: true,
        lastLogin: true,
        updatedAt: true,
      },
      where: {
        isSuperAdmin: false,
      },
    });

    return users.map((user) => this.parseUser(user));
  }
}
