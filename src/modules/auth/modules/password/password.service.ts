import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { EmailDTO } from '../../dto/email.dto';
import { PrismaCommonService } from 'src/common/prisma.common';
import { PrismaService } from 'src/providers/prisma/prisma';
import { AuthCommonService } from '../../common.service';
import { ConfigCommonService } from 'src/common/config.common';
import { EmailService } from 'src/providers/email/email';
import { getChangePasswordEmail } from '../../template-email/change-password.email';
import { ConfirmChangePasswordDTO } from './dto/confirm-change-password.dto';
import { LoggerCommonService } from 'src/common/logger.common';

@Injectable()
export class PasswordService {
  constructor(
    private readonly authCommon: AuthCommonService,
    private readonly prismaCommon: PrismaCommonService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigCommonService,
    private readonly email: EmailService,
    private readonly logger: LoggerCommonService,
  ) {}

  async requestChange(data: EmailDTO) {
    this.logger.logger.info('Password change requested', { email: data.email });

    const existingUser = await this.prismaCommon.getExistingUserByEmail(
      data.email,
    );

    if (!existingUser) {
      this.logger.logger.error(
        'User not found during password change request',
        {
          email: data.email,
        },
      );
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!existingUser.isEmailVerified) {
      this.logger.logger.error('Unverified user attempted password change', {
        email: data.email,
      });
      throw new HttpException(
        'User account is not confirmed',
        HttpStatus.CONFLICT,
      );
    }

    const token = this.authCommon.getJWT();
    const url = `${this.config.clientUrl}/auth/password/confirm-change?token=${token}`;

    try {
      await this.prisma.user.update({
        data: { token },
        where: { email: data.email },
      });
      this.logger.logger.info('Token generated and user updated', {
        email: data.email,
        token,
      });
    } catch (error) {
      this.logger.logger.error(
        'Error updating user token during password change request',
        {
          email: data.email,
          error: error.message,
        },
      );
      throw error;
    }

    try {
      await this.email.sendMail(
        getChangePasswordEmail({
          email: data.email,
          firstName: existingUser.firstName,
          url,
        }),
      );
      this.logger.logger.info('Password change email sent', {
        email: data.email,
      });
    } catch (error) {
      this.logger.logger.error('Error sending password change email', {
        email: data.email,
        error: error.message,
      });
      throw error;
    }
  }

  async confirmChange(data: ConfirmChangePasswordDTO, token: string) {
    if (!token) {
      this.logger.logger.error(
        'Password change confirmation attempted without token',
      );
      throw new HttpException('Token is required', HttpStatus.BAD_REQUEST);
    }

    this.logger.logger.info('Password change confirmation initiated', {
      token,
    });

    try {
      this.authCommon.verifyJWT(token);
      this.logger.logger.info('Token verified successfully', { token });
    } catch {
      this.logger.logger.error(
        'Invalid token during password change confirmation',
        { token },
      );
      throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
    }

    const existingUser = await this.prismaCommon.getExistingUserByToken(token);

    if (!existingUser || !existingUser.isEmailVerified) {
      this.logger.logger.error(
        'User not found or unverified during password change confirmation',
        {
          token,
        },
      );
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    try {
      await this.prisma.user.update({
        data: {
          token: null,
          password: this.authCommon.hashPassword(data.password),
        },
        where: { token },
      });
      this.logger.logger.info('Password updated successfully', {
        userId: existingUser.id,
      });
    } catch (error) {
      this.logger.logger.error(
        'Error updating user password during confirmation',
        {
          userId: existingUser.id,
          error: error.message,
        },
      );
      throw error;
    }
  }
}
