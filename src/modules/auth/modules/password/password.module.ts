import { Module } from '@nestjs/common';
import { PasswordService } from './password.service';
import { PasswordController } from './password.controller';
import { AuthCommonService } from '../../common.service';
import { PrismaCommonService } from 'src/common/prisma.common';
import { PrismaService } from 'src/providers/prisma/prisma';
import { ConfigCommonService } from 'src/common/config.common';
import { EmailService } from 'src/providers/email/email';
import { LoggerCommonService } from 'src/common/logger.common';

@Module({
  controllers: [PasswordController],
  providers: [
    AuthCommonService,
    ConfigCommonService,
    EmailService,
    LoggerCommonService,
    PasswordService,
    PrismaCommonService,
    PrismaService,
  ],
})
export class PasswordModule {}
