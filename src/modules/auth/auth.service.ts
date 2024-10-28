import * as bcrypt from 'bcrypt';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/providers/prisma/prisma';
import { EmailService } from 'src/providers/email/email';
import { CreateAccountDTO } from './dto/create-account.dto';
import {
  confirmAccountTemplateEmailHTML,
  confirmAccountTemplateEmailText,
} from './template-email/create-account';

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private email: EmailService,
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  clientURL = this.config.get<string>('CLIENT_URL');
  emailHostUser = this.config.get<string>('EMAIL_HOST_USER');

  async createAccount(data: CreateAccountDTO) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser)
      throw new HttpException('User already exists.', HttpStatus.CONFLICT);

    const token = this.jwt.sign({ email: data.email });
    const url = `${this.clientURL}/auth/confirm-email?token=${token}`;

    const salt = bcrypt.genSaltSync(10);
    const password = bcrypt.hashSync(data.password, salt);

    try {
      await this.prisma.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          token,
          password,
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
}
