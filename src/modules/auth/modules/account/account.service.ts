import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAccountDTO } from './dto/create-account.dto';
import { PrismaCommonService } from 'src/common/prisma.common';
import { ConfigCommonService } from 'src/common/config.common';
import { PrismaService } from 'src/providers/prisma/prisma';
import { AuthCommonService } from '../../common.service';
import { EmailService } from 'src/providers/email/email';
import { getCreateAccountEmail } from '../../template-email/create-account.email';
import { EmailDTO } from '../../dto/email.dto';

@Injectable()
export class AccountService {
  constructor(
    private readonly prismaCommon: PrismaCommonService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigCommonService,
    private readonly authCommon: AuthCommonService,
    private readonly email: EmailService,
  ) {}

  async confirmEmail(token: string) {
    if (!token)
      throw new HttpException('Token is required', HttpStatus.BAD_REQUEST);

    try {
      this.authCommon.verifyJWT(token);
    } catch {
      throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
    }

    const existingUser = await this.prismaCommon.getExistingUserByToken(token);

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

  async createAccount(data: CreateAccountDTO) {
    const existingUser = await this.prismaCommon.getExistingUserByEmail(
      data.email,
    );

    if (existingUser)
      throw new HttpException('User already exists.', HttpStatus.CONFLICT);

    const token = this.authCommon.getJWT();
    const url = `${this.config.clientUrl}/auth/account/confirm?token=${token}`;

    try {
      await this.prisma.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          token,
          password: this.authCommon.hashPassword(data.password),
          roleId: data.roleId || 1,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new HttpException(
          `The email ${data.email} is already in use.`,
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        'An unexpected error occurred while creating the user.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this.email.sendMail(
      getCreateAccountEmail({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        url,
      }),
    );
  }

  async refreshToken(data: EmailDTO) {
    const existingUser = await this.prismaCommon.getExistingUserByEmail(
      data.email,
    );

    if (!existingUser)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (existingUser.isEmailVerified)
      throw new HttpException('User account is confirmed', HttpStatus.CONFLICT);

    const token = this.authCommon.getJWT();
    const url = `${this.config.clientUrl}/auth/account/confirm?token=${token}`;

    await this.prisma.user.update({
      data: { token },
      where: { id: existingUser.id },
    });

    await this.email.sendMail(
      getCreateAccountEmail({
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        url,
      }),
    );
  }
}
