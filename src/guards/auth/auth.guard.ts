import { Request } from 'express';
import {
  CanActivate,
  ExecutionContext,
  Global,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Roles } from 'src/decorators/role/role.decorator';
import { PrismaService } from 'src/providers/prisma/prisma';
import { JwtPayloadI } from 'src/types/jwt.type';

@Global()
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const routeRoles = this.reflector.get(Roles, context.getHandler());

    if (!routeRoles) return true;

    const request: Request = context.switchToHttp().getRequest();
    const token = request.cookies.access_token;

    if (!token) return false;

    let jwtPayload: JwtPayloadI;
    try {
      jwtPayload = this.jwt.verify<JwtPayloadI>(token);
    } catch {
      return false;
    }

    const userRole = await this.prisma.role.findUnique({
      where: { id: jwtPayload.roleId },
    });

    if (!userRole || !routeRoles.includes(userRole.name)) return false;

    return true;
  }
}
