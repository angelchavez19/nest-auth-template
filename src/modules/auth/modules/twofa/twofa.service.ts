import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { TwoFactorAuthenticationManager } from 'src/common/2fa.common';
import { PrismaService } from 'src/providers/prisma/prisma';
import { JWTUserPayloadI } from 'src/types/jwt.type';
import { AuthCommonService } from '../../common.service';
import { PrismaCommonService } from 'src/common/prisma.common';
import { LoggerCommonService } from 'src/common/logger.common';
import { ConfigCommonService } from 'src/common/config.common';

@Injectable()
export class TwofaService {
  constructor(
    private readonly authCommon: AuthCommonService,
    private readonly configCommon: ConfigCommonService,
    private readonly logger: LoggerCommonService,
    private readonly prismaCommon: PrismaCommonService,
    private readonly prisma: PrismaService,
    private readonly twoFAManager: TwoFactorAuthenticationManager,
  ) {}

  async getTotpCode(user: JWTUserPayloadI) {
    if (!user) {
      this.logger.logger.error(
        'Failed to activate 2FA: User not authenticated',
      );
      throw new HttpException('User not authenticated', HttpStatus.FORBIDDEN);
    }

    const _user = await this.prisma.user.findUnique({
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorIV: true,
      },
      where: { id: user.id },
    });

    if (!_user.twoFactorEnabled) {
      throw new HttpException('MFA not enabled', HttpStatus.CONFLICT);
    }

    const secret = this.twoFAManager.decryptSecret(
      _user.twoFactorSecret,
      _user.twoFactorIV,
    );

    return {
      otpauth_url: new URL(
        `otpauth://totp/${this.configCommon.totpAppName}?secret=${secret}`,
      ).toString(),
    };
  }

  async authenticate(
    req: Request,
    res: Response,
    totpCode: string,
    lang: string = this.configCommon.defaultLang,
  ) {
    const userIdJWT = req.cookies[this.authCommon.USER];

    if (!userIdJWT) {
      this.logger.logger.error('Authentication failed: No JWT in cookies');
      throw new HttpException('Login is required.', HttpStatus.FORBIDDEN);
    }

    const userPayload = this.authCommon.verifyJWT<{ userId: number }>(
      userIdJWT,
    );

    const user = await this.prismaCommon.getExistingUserById(
      userPayload.userId,
    );

    if (!user) {
      this.logger.logger.error('Authentication failed: User not found', {
        userId: userPayload.userId,
      });
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!user.twoFactorEnabled) {
      this.logger.logger.warn('Two-factor authentication not enabled', {
        userId: user.id,
      });
      throw new HttpException(
        'Two factor is not enabled',
        HttpStatus.FORBIDDEN,
      );
    }

    const secret = this.twoFAManager.decryptSecret(
      user.twoFactorSecret,
      user.twoFactorIV,
    );

    if (!this.twoFAManager.verifyTOTP(secret, totpCode)) {
      this.logger.logger.error('Authentication failed: Invalid TOTP code', {
        userId: user.id,
      });
      this.authCommon.clearTokenCookies(res);
      throw new HttpException(
        "User TOTP code isn't valid",
        HttpStatus.UNAUTHORIZED,
      );
    }

    this.logger.logger.info('User authenticated successfully via 2FA', {
      userId: user.id,
    });

    await this.authCommon.generateSessionTokens(user, res, lang, false);
    res.redirect(`${this.configCommon.clientUrl}/${lang}/app`);
    res.send();
  }

  async activeTwoFactorAuthentication(user: JWTUserPayloadI) {
    if (!user) {
      this.logger.logger.error(
        'Failed to activate 2FA: User not authenticated',
      );
      throw new HttpException('User not authenticated', HttpStatus.FORBIDDEN);
    }

    const _user = await this.prisma.user.findUnique({
      select: { twoFactorEnabled: true },
      where: { id: user.id },
    });

    if (_user.twoFactorEnabled) {
      this.logger.logger.info('Deactivating 2FA for user', { userId: user.id });
      await this.prisma.user.update({
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorIV: null,
        },
        where: { id: user.id },
      });
      this.logger.logger.info('2FA deactivated successfully', {
        userId: user.id,
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

    this.logger.logger.info('2FA activated successfully', {
      userId: user.id,
      otpauth_url: secretTOTP.otpauth_url,
    });

    return { otpauth_url: secretTOTP.otpauth_url };
  }
}
