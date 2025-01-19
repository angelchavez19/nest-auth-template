import * as bcrypt from 'bcrypt';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoginDTO } from './dto/login.dto';
import { Request, Response } from 'express';
import { PrismaCommonService } from 'src/common/prisma.common';
import { AuthCommonService } from '../../common.service';
import { PrismaService } from 'src/providers/prisma/prisma';
import { LoggerCommonService } from 'src/common/logger.common';

@Injectable()
export class SessionService {
  constructor(
    private readonly authCommon: AuthCommonService,
    private readonly logger: LoggerCommonService,
    private readonly prisma: PrismaService,
    private readonly prismaCommon: PrismaCommonService,
  ) {}

  async logout(res: Response) {
    try {
      this.authCommon.clearCookies(res);
      this.logger.logger.info('User logged out and cookies cleared.');
      res.send();
    } catch (error) {
      this.logger.logger.error('Error during logout process', {
        error: error.message,
      });
      throw error;
    }
  }

  async refreshToken(req: Request, res: Response) {
    const userRefreshToken = req.cookies[this.authCommon.REFRESH_TOKEN];

    if (!userRefreshToken) {
      this.logger.logger.error('Missing refresh token in request.');
      throw new HttpException('Invalid refresh token', HttpStatus.FORBIDDEN);
    }

    this.logger.logger.info('Attempting to refresh token.', {
      refreshToken: userRefreshToken,
    });

    const existingUser = await this.prisma.user.findUnique({
      select: this.prismaCommon.selectExistingUser,
      where: { refreshToken: userRefreshToken },
    });

    if (!existingUser) {
      this.logger.logger.error('Invalid refresh token provided.', {
        refreshToken: userRefreshToken,
      });
      throw new HttpException('Invalid refresh token', HttpStatus.FORBIDDEN);
    }

    try {
      await this.authCommon.generateSessionTokens(existingUser, res, false);
      this.logger.logger.info('Session tokens refreshed successfully.', {
        userId: existingUser.id,
      });
      res.send();
    } catch (error) {
      this.logger.logger.error('Error refreshing session tokens.', {
        userId: existingUser.id,
        error: error.message,
      });
      throw error;
    }
  }

  async login(data: LoginDTO, res: Response) {
    this.logger.logger.info('Login attempt started.', { email: data.email });

    const existingUser = await this.prismaCommon.getExistingUserByEmail(
      data.email,
    );

    if (!existingUser) {
      this.logger.logger.error('Login failed. User not found', {
        email: data.email,
      });
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    } else if (!existingUser.isEmailVerified) {
      this.logger.logger.error('Login failed. User unverified.', {
        email: data.email,
      });
      throw new HttpException('User unverified', HttpStatus.NOT_FOUND);
    }

    const passwordMatch = bcrypt.compareSync(
      data.password,
      existingUser.password,
    );
    if (!passwordMatch) {
      this.logger.logger.error('Invalid credentials provided.', {
        email: data.email,
      });
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    try {
      await this.authCommon.generateSessionTokens(existingUser, res);
      this.logger.logger.info('User logged in successfully.', {
        userId: existingUser.id,
      });
      res.send();
    } catch (error) {
      this.logger.logger.error('Error during login token generation.', {
        userId: existingUser.id,
        error: error.message,
      });
      throw error;
    }
  }
}
