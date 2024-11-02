import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/providers/prisma/prisma';
import { EmailService } from 'src/providers/email/email';
import { CreateAccountDTO } from './dto/create-account.dto';
import { LoginDTO } from './dto/login.dto';
import {
  confirmAccountTemplateEmailHTML,
  confirmAccountTemplateEmailText,
} from './template-email/create-account';
import { RequestChangePasswordDTO } from './dto/request-change-password.dto';
import { changePasswordTemplateEmailHTML } from './template-email/request-change-password';
import { ConfirmChangePasswordDTO } from './dto/confirm-change-password.dto';

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

    const jwt = this._getJWT({
      email: existingUser.email,
      roleId: existingUser.roleId,
    });

    response
      .cookie('jwt', jwt, {
        domain: this.clientDomain,
        expires: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 3),
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

  async requestChangePassword(data: RequestChangePasswordDTO) {
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
    return this.prisma.user.findUnique({ where: { email } });
  }

  _getExistingUserByToken(token: string) {
    return this.prisma.user.findUnique({ where: { token } });
  }
}
