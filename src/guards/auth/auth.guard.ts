import { Request } from 'express';
import {
  CanActivate,
  ExecutionContext,
  Global,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { TokenManager } from 'src/common/token-manager.common';
import { Roles } from 'src/decorators/role/role.decorator';
import { PrismaService } from 'src/providers/prisma/prisma';

@Global()
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  tokenManager = new TokenManager(this.jwt);

  async canActivate(context: ExecutionContext) {
    const routeRoles = this.reflector.get(Roles, context.getHandler());

    const request = context.switchToHttp().getRequest();
    const payload = this.tokenManager.getAccessTokenFromRequest(request);

    if (!payload && !routeRoles) return true;
    if (!payload && routeRoles) return false;

    request.user = payload;

    if (!routeRoles) return true;

    const userRole = await this.prisma.role.findUnique({
      where: { id: payload.roleId },
    });

    if (!userRole || !routeRoles.includes(userRole.name)) return false;

    return true;
  }
}
