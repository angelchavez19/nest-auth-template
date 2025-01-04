import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/providers/prisma/prisma';
import { CreateRoleDTO } from './dto/create-role.dto';
import { UpdateRoleNameDTO } from './dto/update-role-name.dto';
import { AssignRoleDTO } from './dto/assign-role.dto';
import { LoggerCommonService } from 'src/common/logger.common';

@Injectable()
export class RolesService {
  constructor(
    private readonly logger: LoggerCommonService,
    private readonly prisma: PrismaService,
  ) {}

  async getAllRoles() {
    return await this.prisma.role.findMany({
      select: {
        id: true,
        name: true,
        permissions: {
          select: {
            id: true,
            permission: {
              select: {
                id: true,
                name: true,
                route: true,
              },
            },
          },
        },
      },
    });
  }

  async createRole(data: CreateRoleDTO) {
    const exceptionMessage = await this.prisma.$transaction(async (tx) => {
      let newRole = null;
      try {
        newRole = await tx.role.create({
          data: { name: data.name },
        });
      } catch {
        return 'The role already exists';
      }

      const existingPermissions = await tx.permission.findMany({
        where: { name: { in: data.permissions.map((p) => p.name) } },
      });

      const existingPermissionNames = existingPermissions.map((p) => p.name);

      const newPermissionsToCreate = data.permissions.filter(
        (p) => !existingPermissionNames.includes(p.name),
      );

      if (newPermissionsToCreate.length > 0) {
        await tx.permission.createMany({
          data: newPermissionsToCreate,
        });
      }

      const allPermissions = await tx.permission.findMany({
        where: { name: { in: data.permissions.map((p) => p.name) } },
      });

      try {
        await tx.rolePermission.createMany({
          data: allPermissions.map((permission) => ({
            roleId: newRole.id,
            permissionId: permission.id,
          })),
        });
      } catch {
        return 'Error creating permissions';
      }
    });

    if (exceptionMessage) {
      this.logger.logger.error('Error creating role', {
        reason: exceptionMessage,
      });
      throw new HttpException(exceptionMessage, HttpStatus.BAD_REQUEST);
    }

    this.logger.logger.info('Role creted', {
      name: data.name,
      permissions: data.permissions.map((permission) => ({
        name: permission.name,
        route: permission.route,
      })),
    });
  }

  async updateRoleName(id: number, data: UpdateRoleNameDTO) {
    try {
      await this.prisma.role.update({
        data: { name: data.name },
        where: { id },
      });

      this.logger.logger.info('Role name updated', { id, name: data.name });
    } catch {
      this.logger.logger.error('Error updating role name', {
        reason: 'Role not found',
      });
    }
  }

  async deleteRole(id: number) {
    try {
      await this.prisma.role.delete({
        where: { id },
      });

      this.logger.logger.info('Role deleted', { id });
    } catch {
      this.logger.logger.error('Error deleting role', {
        reason: 'Role not found',
      });
      throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
    }
  }

  async assignRole(data: AssignRoleDTO) {
    try {
      await this.prisma.user.update({
        data: { roleId: data.roleId },
        where: { id: data.userId },
      });
      this.logger.logger.info('Role assigned', {
        roleId: data.roleId,
        userId: data.userId,
      });
    } catch {
      this.logger.logger.error('Error assigning role', {
        reason: 'User id or role id not exists',
      });
      throw new HttpException(
        'User id or role id not exists',
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
