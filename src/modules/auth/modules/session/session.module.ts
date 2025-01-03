import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { PrismaCommonService } from 'src/common/prisma.common';
import { AuthCommonService } from '../../common.service';
import { PrismaService } from 'src/providers/prisma/prisma';
import { ConfigCommonService } from 'src/common/config.common';
import { LoggerCommonService } from 'src/common/logger.common';

@Module({
  controllers: [SessionController],
  providers: [
    AuthCommonService,
    ConfigCommonService,
    LoggerCommonService,
    SessionService,
    PrismaService,
    PrismaCommonService,
  ],
})
export class SessionModule {}
