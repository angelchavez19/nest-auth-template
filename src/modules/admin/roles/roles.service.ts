import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/providers/prisma/prisma';
import { CreateRoleDTO } from './dto/create-role.dto';
import { UpdateRoleNameDTO } from './dto/update-role-name.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

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

    if (exceptionMessage)
      throw new HttpException(exceptionMessage, HttpStatus.BAD_REQUEST);
  }

  async updateRoleName(id: number, data: UpdateRoleNameDTO) {
    await this.prisma.role.update({
      data: { name: data.name },
      where: { id },
    });
  }

  async deleteRole(id: number) {
    try {
      await this.prisma.role.delete({
        where: { id },
      });
    } catch {
      throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
    }
  }
}
