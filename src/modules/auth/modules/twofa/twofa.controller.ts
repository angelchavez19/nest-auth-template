import { Controller, Get, Patch, Query, Req, Res } from '@nestjs/common';
import { TwofaService } from './twofa.service';
import { GetUser } from 'src/decorators/get-user/get-user.decorator';
import { JWTUserPayloadI } from 'src/types/jwt.type';
import { Request, Response } from 'express';

@Controller('auth/twofa')
export class TwofaController {
  constructor(private readonly twofaService: TwofaService) {}

  @Get()
  getTotpCode(@GetUser() user: JWTUserPayloadI) {
    return this.twofaService.getTotpCode(user);
  }

  @Get('authenticate')
  authenticate(
    @Req() req: Request,
    @Res() res: Response,
    @Query('totpCode') totpCode: string,
  ) {
    return this.twofaService.authenticate(req, res, totpCode);
  }

  @Patch('toogle')
  activeTwoFactorAuthentication(@GetUser() user: JWTUserPayloadI) {
    return this.twofaService.activeTwoFactorAuthentication(user);
  }
}
