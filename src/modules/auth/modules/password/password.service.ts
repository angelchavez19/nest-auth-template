import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { EmailDTO } from '../../dto/email.dto';
import { PrismaCommonService } from 'src/common/prisma.common';
import { PrismaService } from 'src/providers/prisma/prisma';
import { AuthCommonService } from '../../common.service';
import { ConfigCommonService } from 'src/common/config.common';
import { EmailService } from 'src/providers/email/email';
import { getChangePasswordEmail } from '../../template-email/change-password.email';
import { ConfirmChangePasswordDTO } from './dto/confirm-change-password.dto';

@Injectable()
export class PasswordService {
  constructor(
    private readonly authCommon: AuthCommonService,
    private readonly prismaCommon: PrismaCommonService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigCommonService,
    private readonly email: EmailService,
  ) {}

  async requestChange(data: EmailDTO) {
    const existingUser = await this.prismaCommon.getExistingUserByEmail(
      data.email,
    );

    if (!existingUser)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    if (!existingUser.isEmailVerified)
      throw new HttpException(
        'User account is not confirmed',
        HttpStatus.CONFLICT,
      );

    const token = this.authCommon.getJWT();
    const url = `${this.config.clientUrl}/auth/password/confirm-change?token=${token}`;

    await this.prisma.user.update({
      data: { token },
      where: { email: data.email },
    });

    await this.email.sendMail(
      getChangePasswordEmail({
        email: data.email,
        firstName: existingUser.firstName,
        url,
      }),
    );
  }

  async confirmChange(data: ConfirmChangePasswordDTO, token: string) {
    if (!token)
      throw new HttpException('Token is required', HttpStatus.BAD_REQUEST);

    try {
      this.authCommon.verifyJWT(token);
    } catch {
      throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
    }

    const existingUser = await this.prismaCommon.getExistingUserByToken(token);

    if (!existingUser || !existingUser.isEmailVerified)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    await this.prisma.user.update({
      data: {
        token: null,
        password: this.authCommon.hashPassword(data.password),
      },
      where: { token },
    });
  }
}
