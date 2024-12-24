import * as speakeasy from 'speakeasy';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { EnableTwoFactorAutenticationDTO } from './dto/enable-2fa.dto';
import { PrismaService } from 'src/providers/prisma/prisma';
import { JWTUserPayloadI } from 'src/types/jwt.type';
import { ConfigService } from '@nestjs/config';
import { TwoFactorAuthenticationManager } from 'src/common/2fa.common';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  twoFactorManager = new TwoFactorAuthenticationManager();

  encryptionKey = this.config.get<string>('ENCRYPTION_KEY');

  async enableTwoFactorAutentication(
    user: JWTUserPayloadI,
    data: EnableTwoFactorAutenticationDTO,
  ) {
    if (!user)
      throw new HttpException('User not authenticated', HttpStatus.FORBIDDEN);

    if (!data.enable) {
      await this.prisma.user.update({
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorIV: null,
        },
        where: { id: user.id },
      });
      return;
    }

    const secretTOTP = speakeasy.generateSecret({
      length: 20,
      name: 'Nest Auth Template', // TODO: Config file
    });

    const { encrypted, iv } = this.twoFactorManager.encryptSecret(
      secretTOTP.base32,
      this.encryptionKey,
    );

    await this.prisma.user.update({
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: encrypted,
        twoFactorIV: iv,
      },
      where: { id: user.id },
    });

    return { otpauth_url: secretTOTP.otpauth_url };
  }

  users = [
    { id: 1, name: 'User 1' },
    { id: 2, name: 'User 2' },
    { id: 3, name: 'User 3' },
  ];

  getAllUsers() {
    return this.users;
  }

  getInfoUser(id: number) {
    return this.users.filter((user) => id === user.id);
  }
}
