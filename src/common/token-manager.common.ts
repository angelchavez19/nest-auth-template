import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AccessTokenJwtPayloadI } from 'src/types/jwt.type';

export class TokenManager {
  constructor(private jwt: JwtService) {}

  getAccessTokenFromRequest(req: Request) {
    const accessToken = req.cookies.access_token;

    if (!accessToken) return;

    return this.verifyToken<AccessTokenJwtPayloadI>(accessToken);
  }

  verifyToken<T extends object = any>(token: string) {
    try {
      return this.jwt.verify<T>(token);
    } catch {
      return;
    }
  }
}
