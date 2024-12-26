import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { PrismaService } from 'src/providers/prisma/prisma';
import { PrismaCommonService } from 'src/common/prisma.common';
import { ConfigCommonService } from 'src/common/config.common';
import { AuthCommonService } from '../../common.service';
import { EmailService } from 'src/providers/email/email';

@Module({
  controllers: [AccountController],
  providers: [
    AccountService,
    AuthCommonService,
    ConfigCommonService,
    EmailService,
    PrismaCommonService,
    PrismaService,
  ],
})
export class AccountModule {}
