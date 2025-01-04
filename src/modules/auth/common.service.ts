import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ExistingUserI } from 'src/common/prisma.common';
import { CookieOptions, Response } from 'express';
import { ConfigCommonService } from 'src/common/config.common';
import { PrismaService } from 'src/providers/prisma/prisma';
import { LoggerCommonService } from 'src/common/logger.common';

@Injectable()
export class AuthCommonService {
  constructor(
    private readonly jwt: JwtService,
    private readonly configCommon: ConfigCommonService,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerCommonService,
  ) {}

  REFRESH_TOKEN = 'refresh_token';
  ACCESS_TOKEN = 'access_token';
  USER = 'user';

  hashPassword(password: string) {
    const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    this.logger.logger.info('Password hashed successfully');
    return hashedPassword;
  }

  getJWT(payload: object = {}, config?: JwtSignOptions) {
    const token = this.jwt.sign(payload, config);
    this.logger.logger.info('JWT generated', { payload });
    return token;
  }

  verifyJWT<T extends object>(token: string) {
    try {
      const verified = this.jwt.verify<T>(token);
      this.logger.logger.info('JWT verified successfully', { token });
      return verified;
    } catch (error) {
      this.logger.logger.error('JWT verification failed', { token, error });
      throw error;
    }
  }

  clearCookies(response: Response) {
    this.clearTokenCookies(response);
    this.clearUserCookie(response);
    this.logger.logger.info('All cookies cleared');
  }

  clearUserCookie(response: Response) {
    response.clearCookie(this.USER);
    this.logger.logger.info('User cookie cleared');
  }

  clearTokenCookies(response: Response) {
    response.clearCookie(this.REFRESH_TOKEN);
    response.clearCookie(this.ACCESS_TOKEN);
    this.logger.logger.info('Token cookies cleared');
  }

  async generateSessionTokens(
    user: ExistingUserI,
    response: Response,
    twoFA: boolean = true,
  ) {
    const cookieConfig: CookieOptions = {
      domain: this.configCommon.clientDomain,
      expires: new Date(Date.now() + 1000 * 60 * 5),
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    };

    if (user.twoFactorEnabled && twoFA) {
      const token = this.getJWT({ userId: user.id }, { expiresIn: '5m' });
      response.cookie(this.USER, token, cookieConfig);
      this.clearTokenCookies(response);
      this.logger.logger.error("User has 2FA enabled and isn't using it", {
        userId: user.id,
        twoFactorEnabled: true,
      });
      throw new HttpException('2fa_required', HttpStatus.UNAUTHORIZED);
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();
    const expirationToken = new Date(
      new Date().getTime() + 1000 * 60 * 60 * 24 * 3,
    );

    await this.prisma.user.update({
      data: { refreshToken, expirationToken },
      where: { email: user.email },
    });

    response
      .cookie(this.ACCESS_TOKEN, accessToken, {
        ...cookieConfig,
        expires: new Date(new Date().getTime() + 1000 * 60 * 60),
      })
      .cookie(this.REFRESH_TOKEN, refreshToken, {
        ...cookieConfig,
        expires: expirationToken,
      });

    this.logger.logger.info('Session tokens generated and cookies set', {
      userId: user.id,
      accessToken,
      refreshToken,
    });
  }

  generateAccessToken(user: ExistingUserI) {
    const token = this.getJWT({
      id: user.id,
      email: user.email,
      role: user.role.name,
      roleId: user.roleId,
    });
    this.logger.logger.info('Access token generated', { userId: user.id });
    return token;
  }

  generateRefreshToken() {
    const token = crypto.randomBytes(32).toString('hex');
    this.logger.logger.info('Refresh token generated');
    return token;
  }
}
