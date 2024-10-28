import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from 'src/providers/email/email';
import { PrismaService } from 'src/providers/prisma/prisma';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, ConfigService, EmailService, PrismaService],
})
export class AuthModule {}
