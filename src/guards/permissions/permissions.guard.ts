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
import { Permissions } from 'src/decorators/permission/permission.decorator';
import { PrismaService } from 'src/providers/prisma/prisma';

@Global()
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  tokenManager = new TokenManager(this.jwt);

  async canActivate(context: ExecutionContext) {
    const requiredPermissions = this.reflector.get(
      Permissions,
      context.getHandler(),
    );

    if (!requiredPermissions) return true;

    const request: Request = context.switchToHttp().getRequest();
    const payload = this.tokenManager.getAccessTokenFromRequest(request);

    if (!payload) return false;

    const permissions = await this.prisma.rolePermission.findMany({
      select: { permission: { select: { name: true } } },
      where: { roleId: payload.roleId, permission: { route: request.url } },
    });

    return requiredPermissions.every((perm) =>
      permissions.map((p) => p.permission.name).includes(perm),
    );
  }
}
