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
import { JWTUserPayloadI } from 'src/types/jwt.type';

@Global()
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  tokenManager = new TokenManager(this.jwt);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions: string[] = this.reflector.get<string[]>(
      Permissions,
      context.getHandler(),
    );

    if (!requiredPermissions) return true;

    const request = context.switchToHttp().getRequest();
    const payload: JWTUserPayloadI = request.user;

    if (!payload) return false;
    if (payload.role === 'ADMIN') return true;

    const permissions = await this.prisma.rolePermission.findMany({
      select: { permission: { select: { name: true, route: true } } },
      where: { roleId: payload.roleId },
    });

    const userPermissions = permissions.map((p) => ({
      name: p.permission.name,
      route: p.permission.route,
    }));

    const hasPermission = requiredPermissions.every((perm) =>
      userPermissions.some(
        (userPerm) =>
          this.matchRoute(request.url, userPerm.route) &&
          userPerm.name === perm,
      ),
    );

    return hasPermission;
  }

  private matchRoute(requestUrl: string, permissionRoute: string): boolean {
    const routePattern = new RegExp(
      '^' + permissionRoute.replace(/:\w+/g, '\\w+').replace(/\*/g, '.*') + '$',
    );
    return routePattern.test(requestUrl);
  }
}
