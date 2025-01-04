import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { PrismaService } from 'src/providers/prisma/prisma';
import { LoggerCommonService } from 'src/common/logger.common';
import { ConfigCommonService } from 'src/common/config.common';

@Module({
  controllers: [RolesController],
  providers: [
    ConfigCommonService,
    LoggerCommonService,
    RolesService,
    PrismaService,
  ],
})
export class RolesModule {}
