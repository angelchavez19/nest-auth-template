import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/providers/prisma/prisma';
import { UpdatePermissionDTO } from './dto/update-permission.dto';
import { CreatePermissionDTO } from './dto/create-permission.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async getAllPermissions(id: number) {
    return this.prisma.permission.findMany({
      where: {
        RolePermission: {
          some: {
            roleId: id,
          },
        },
      },
    });
  }

  async createPermission(id: number, data: CreatePermissionDTO) {
    const exception = await this.prisma.$transaction(async (tx) => {
      let newPermission = null;
      try {
        newPermission = await tx.permission.create({
          data,
        });
      } catch {
        return new HttpException(
          'The permission already exists',
          HttpStatus.CONFLICT,
        );
      }

      await tx.rolePermission.create({
        data: {
          roleId: id,
          permissionId: newPermission.id,
        },
      });
    });

    if (exception) throw exception;
  }

  async updatePermission(id: number, data: UpdatePermissionDTO) {
    try {
      await this.prisma.permission.update({
        data: data,
        where: { id },
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new HttpException(
            'Name of permission already exists.',
            HttpStatus.CONFLICT,
          );

        if (error.code === 'P2025')
          throw new HttpException('Permission not found', HttpStatus.NOT_FOUND);
      }

      throw new HttpException(
        'An unexpected error occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deletePermission(id: number) {
    try {
      await this.prisma.permission.delete({
        where: { id },
      });
    } catch {
      throw new HttpException('Permission not found', HttpStatus.NOT_FOUND);
    }
  }

  async deleteRolePermission(id: number, permissionId: number) {
    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId: id,
        permissionId: permissionId,
      },
    });
  }
}
