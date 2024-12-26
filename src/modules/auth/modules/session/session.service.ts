import * as bcrypt from 'bcrypt';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoginDTO } from './dto/login.dto';
import { Request, Response } from 'express';
import { PrismaCommonService } from 'src/common/prisma.common';
import { AuthCommonService } from '../../common.service';
import { PrismaService } from 'src/providers/prisma/prisma';

@Injectable()
export class SessionService {
  constructor(
    private readonly authCommon: AuthCommonService,
    private readonly prisma: PrismaService,
    private readonly prismaCommon: PrismaCommonService,
  ) {}

  async logout(res: Response) {
    this.authCommon.clearCookies(res);
    res.send();
  }

  async refreshToken(req: Request, res: Response) {
    const userRefreshToken = req.cookies[this.authCommon.REFRESH_TOKEN];

    if (!userRefreshToken)
      throw new HttpException('Invalid refresh token', HttpStatus.FORBIDDEN);

    const existingUser = await this.prisma.user.findUnique({
      select: this.prismaCommon.selectExistingUser,
      where: { refreshToken: userRefreshToken },
    });

    if (!existingUser)
      throw new HttpException('Invalid refresh token', HttpStatus.FORBIDDEN);

    await this.authCommon.generateSessionTokens(existingUser, res, false);
    res.send();
  }

  async login(data: LoginDTO, res: Response) {
    const existingUser = await this.prismaCommon.getExistingUserByEmail(
      data.email,
    );

    if (!existingUser || !existingUser.isEmailVerified)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (!bcrypt.compareSync(data.password, existingUser.password))
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);

    await this.authCommon.generateSessionTokens(existingUser, res);
    res.send();
  }
}
