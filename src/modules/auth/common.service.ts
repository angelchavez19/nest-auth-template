import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ExistingUserI } from 'src/common/prisma.common';
import { CookieOptions, Response } from 'express';
import { ConfigCommonService } from 'src/common/config.common';
import { PrismaService } from 'src/providers/prisma/prisma';

@Injectable()
export class AuthCommonService {
  constructor(
    private readonly jwt: JwtService,
    private readonly configCommon: ConfigCommonService,
    private readonly prisma: PrismaService,
  ) {}

  REFRESH_TOKEN = 'refresh_token';
  ACCESS_TOKEN = 'access_token';
  USER = 'user';

  hashPassword(password: string) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  }

  getJWT(payload: object = {}, config?: JwtSignOptions) {
    return this.jwt.sign(payload, config);
  }

  verifyJWT<T extends object>(token: string) {
    return this.jwt.verify<T>(token);
  }

  clearCookies(response: Response) {
    this.clearTokenCookies(response);
    this.clearUserCookie(response);
  }

  clearUserCookie(response: Response) {
    response.clearCookie(this.USER);
  }

  clearTokenCookies(response: Response) {
    response.clearCookie(this.REFRESH_TOKEN);
    response.clearCookie(this.ACCESS_TOKEN);
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
  }

  generateAccessToken(user: ExistingUserI) {
    return this.getJWT({
      id: user.id,
      email: user.email,
      role: user.role.name,
      roleId: user.roleId,
    });
  }

  generateRefreshToken() {
    return crypto.randomBytes(32).toString('hex');
  }
}
