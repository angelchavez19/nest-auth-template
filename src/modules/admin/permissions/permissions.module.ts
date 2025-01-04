import { Module } from '@nestjs/common';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { PrismaService } from 'src/providers/prisma/prisma';
import { LoggerCommonService } from 'src/common/logger.common';
import { ConfigCommonService } from 'src/common/config.common';

@Module({
  controllers: [PermissionsController],
  providers: [
    ConfigCommonService,
    LoggerCommonService,
    PermissionsService,
    PrismaService,
  ],
})
export class PermissionsModule {}
