import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { TwoFactorAuthenticationManager } from 'src/common/2fa.common';
import { PrismaService } from 'src/providers/prisma/prisma';
import { JWTUserPayloadI } from 'src/types/jwt.type';
import { AuthCommonService } from '../../common.service';
import { PrismaCommonService } from 'src/common/prisma.common';

@Injectable()
export class TwofaService {
  constructor(
    private readonly authCommon: AuthCommonService,
    private readonly prismaCommon: PrismaCommonService,
    private readonly prisma: PrismaService,
    private readonly twoFAManager: TwoFactorAuthenticationManager,
  ) {}

  async authenticate(req: Request, res: Response, totpCode: string) {
    const userIdJWT = req.cookies[this.authCommon.USER];

    if (!userIdJWT)
      throw new HttpException('Login is required.', HttpStatus.FORBIDDEN);

    const userPayload = this.authCommon.verifyJWT<{ userId: number }>(
      userIdJWT,
    );

    const user = await this.prismaCommon.getExistingUserById(
      userPayload.userId,
    );

    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (!user.twoFactorEnabled)
      throw new HttpException(
        'Two factor is not enabled',
        HttpStatus.FORBIDDEN,
      );

    const secret = this.twoFAManager.decryptSecret(
      user.twoFactorSecret,
      user.twoFactorIV,
    );

    if (!this.twoFAManager.verifyTOTP(secret, totpCode)) {
      this.authCommon.clearTokenCookies(res);
      throw new HttpException(
        "User TOTP code isn't valid",
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.authCommon.generateSessionTokens(user, res, false);
    res.send();
  }

  async activeTwoFactorAuthentication(user: JWTUserPayloadI) {
    if (!user)
      throw new HttpException('User not authenticated', HttpStatus.FORBIDDEN);

    const _user = await this.prisma.user.findUnique({
      select: { twoFactorEnabled: true },
      where: { id: user.id },
    });

    if (_user.twoFactorEnabled) {
      await this.prisma.user.update({
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorIV: null,
        },
        where: { id: user.id },
      });
      return;
    }

    const { secretTOTP, encrypted, iv } = this.twoFAManager.makeTOTPsecret();

    await this.prisma.user.update({
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: encrypted,
        twoFactorIV: iv,
      },
      where: { id: user.id },
    });

    return { otpauth_url: secretTOTP.otpauth_url };
  }
}
