import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/providers/prisma/prisma';

@Module({
  controllers: [UserController],
  providers: [UserService, ConfigService, PrismaService],
})
export class UserModule {}
