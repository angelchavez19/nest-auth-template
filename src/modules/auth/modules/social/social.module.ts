import { Module } from '@nestjs/common';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { AuthCommonService } from '../../common.service';
import { ConfigCommonService } from 'src/common/config.common';
import { PrismaService } from 'src/providers/prisma/prisma';
import { PrismaCommonService } from 'src/common/prisma.common';

@Module({
  controllers: [SocialController],
  providers: [
    AuthCommonService,
    SocialService,
    ConfigCommonService,
    PrismaService,
    PrismaCommonService,
  ],
})
export class SocialModule {}
