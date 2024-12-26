import { Module } from '@nestjs/common';
import { TwofaService } from './twofa.service';
import { TwofaController } from './twofa.controller';
import { PrismaService } from 'src/providers/prisma/prisma';
import { TwoFactorAuthenticationManager } from 'src/common/2fa.common';
import { ConfigCommonService } from 'src/common/config.common';
import { AuthCommonService } from '../../common.service';
import { PrismaCommonService } from 'src/common/prisma.common';

@Module({
  controllers: [TwofaController],
  providers: [
    AuthCommonService,
    ConfigCommonService,
    PrismaCommonService,
    PrismaService,
    TwoFactorAuthenticationManager,
    TwofaService,
  ],
})
export class TwofaModule {}
