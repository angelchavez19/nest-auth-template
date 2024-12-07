import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Request, Response } from 'express';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/providers/prisma/prisma';
import { EmailService } from 'src/providers/email/email';
import { CreateAccountDTO } from './dto/create-account.dto';
import { LoginDTO } from './dto/login.dto';
import { ConfirmChangePasswordDTO } from './dto/confirm-change-password.dto';
import { RequestTokenRefreshDTO } from './dto/request-refresh-token.dto';
import {
  confirmAccountTemplateEmailHTML,
  confirmAccountTemplateEmailText,
} from './template-email/create-account';
import { changePasswordTemplateEmailHTML } from './template-email/request-change-password';

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private email: EmailService,
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  clientURL = this.config.get<string>('CLIENT_URL');
  clientDomain = this.config.get<string>('CLIENT_DOMAIN');
  emailHostUser = this.config.get<string>('EMAIL_HOST_USER');

  async createAccount(data: CreateAccountDTO) {
    const existingUser = await this._getExistingUserByEmail(data.email);

    if (existingUser)
      throw new HttpException('User already exists.', HttpStatus.CONFLICT);

    const token = this.jwt.sign({});
    const url = `${this.clientURL}/auth/confirm-email?token=${token}`;

    try {
      await this.prisma.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          token,
          password: this._getHashedPassword(data.password),
          roleId: data.roleId || 1,
        },
      });
    } catch {
      throw new HttpException('Something wrong', HttpStatus.CONFLICT);
    }

    await this.email.sendMail({
      email: data.email,
      subject: `Confirm Email <${this.emailHostUser}>`,
      text: confirmAccountTemplateEmailText(data, url),
      html: confirmAccountTemplateEmailHTML(data, url),
    });
  }

  async login(data: LoginDTO, response: Response) {
    const existingUser = await this._getExistingUserByEmail(data.email);

    if (!existingUser || !existingUser.isEmailVerified)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (!bcrypt.compareSync(data.password, existingUser.password))
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);

    const accessToken = this._getJWT({
      email: existingUser.email,
      role: existingUser.role.name,
      roleId: existingUser.roleId,
    });

    const refreshToken = this._generateRefreshToken();
    const expirationToken = new Date(
      new Date().getTime() + 1000 * 60 * 60 * 24 * 3,
    );

    await this.prisma.user.update({
      data: { refreshToken, expirationToken },
      where: { email: existingUser.email },
    });

    response
      .cookie('access_token', accessToken, {
        domain: this.clientDomain,
        expires: new Date(new Date().getTime() + 1000 * 60 * 60),
        httpOnly: true,
        sameSite: 'strict',
      })
      .cookie('refresh_token', refreshToken, {
        domain: this.clientDomain,
        expires: expirationToken,
        httpOnly: true,
        sameSite: 'strict',
      })
      .send();
  }

  async logout(response: Response) {
    response
      .cookie('access_token', '', {
        domain: this.clientDomain,
        expires: new Date(),
        httpOnly: true,
        sameSite: 'strict',
      })
      .cookie('refresh_token', '', {
        domain: this.clientDomain,
        expires: new Date(),
        httpOnly: true,
        sameSite: 'strict',
      })
      .send();
  }

  async refreshToken(request: Request, response: Response) {
    const _refreshToken = request.cookies.refresh_token;

    if (!_refreshToken)
      throw new HttpException('Invalid refresh token', HttpStatus.FORBIDDEN);

    const existingUser = await this.prisma.user.findUnique({
      where: { refreshToken: _refreshToken },
    });

    if (!existingUser)
      throw new HttpException('Invalid refresh token', HttpStatus.FORBIDDEN);

    const accessToken = this._getJWT({
      email: existingUser.email,
      roleId: existingUser.roleId,
    });

    const refreshToken = this._generateRefreshToken();
    const expirationToken = new Date(
      new Date().getTime() + 1000 * 60 * 60 * 24 * 3,
    );

    await this.prisma.user.update({
      data: { refreshToken, expirationToken },
      where: { email: existingUser.email },
    });

    response
      .cookie('access_token', accessToken, {
        domain: this.clientDomain,
        expires: new Date(new Date().getTime() + 1000 * 60 * 60),
        httpOnly: true,
        sameSite: 'strict',
      })
      .cookie('refresh_token', refreshToken, {
        domain: this.clientDomain,
        expires: expirationToken,
        httpOnly: true,
        sameSite: 'strict',
      })
      .send();
  }

  async confirmEmail(token: string) {
    if (!token)
      throw new HttpException('Token is required', HttpStatus.BAD_REQUEST);

    const existingUser = await this._getExistingUserByToken(token);

    if (!existingUser || existingUser.isEmailVerified)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    try {
      await this.prisma.user.update({
        data: { token: null, isEmailVerified: true },
        where: { token },
      });
    } catch {
      throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
    }
  }

  async requestRefreshAccountCreationToken(data: RequestTokenRefreshDTO) {
    const existingUser = await this._getExistingUserByEmail(data.email);

    if (!existingUser)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (existingUser.isEmailVerified)
      throw new HttpException('User account is confirmed', HttpStatus.CONFLICT);

    const token = this._getJWT();
    const url = `${this.clientURL}/auth/confirm-email?token=${token}`;

    await this.prisma.user.update({
      data: { token },
      where: { email: data.email },
    });

    await this.email.sendMail({
      email: data.email,
      subject: `Confirm Email <${this.emailHostUser}>`,
      text: confirmAccountTemplateEmailText(existingUser, url),
      html: confirmAccountTemplateEmailHTML(existingUser, url),
    });
  }

  async requestChangePassword(data: RequestTokenRefreshDTO) {
    const existingUser = await this._getExistingUserByEmail(data.email);

    if (!existingUser)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (!existingUser.isEmailVerified)
      throw new HttpException(
        'User account is not confirmed',
        HttpStatus.CONFLICT,
      );

    const token = this._getJWT();
    const url = `${this.clientURL}/auth/confirm-change-password?token=${token}`;

    await this.prisma.user.update({
      data: { token },
      where: { email: data.email },
    });

    await this.email.sendMail({
      email: existingUser.email,
      subject: `Password Reset Request <${this.emailHostUser}>`,
      text: changePasswordTemplateEmailHTML(existingUser.firstName, url),
      html: changePasswordTemplateEmailHTML(existingUser.firstName, url),
    });
  }

  async confirmChangePassword(data: ConfirmChangePasswordDTO, token: string) {
    if (!token)
      throw new HttpException('Token is required', HttpStatus.BAD_REQUEST);

    try {
      this.jwt.verify(token);
    } catch {
      throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
    }

    const existingUser = await this._getExistingUserByToken(token);

    if (!existingUser || !existingUser.isEmailVerified)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    await this.prisma.user.update({
      data: { token: null, password: this._getHashedPassword(data.password) },
      where: { token },
    });
  }

  _getHashedPassword(password: string) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  }

  _getJWT(payload: object = {}) {
    return this.jwt.sign(payload);
  }

  _getExistingUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      select: {
        email: true,
        isEmailVerified: true,
        password: true,
        firstName: true,
        lastName: true,
        roleId: true,
        role: {
          select: { name: true },
        },
      },
      where: { email },
    });
  }

  _getExistingUserByToken(token: string) {
    return this.prisma.user.findUnique({ where: { token } });
  }

  _generateRefreshToken() {
    return randomBytes(32).toString('hex');
  }
}
