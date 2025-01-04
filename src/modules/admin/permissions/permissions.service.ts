import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/providers/prisma/prisma';
import { UpdatePermissionDTO } from './dto/update-permission.dto';
import { CreatePermissionDTO } from './dto/create-permission.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { LoggerCommonService } from 'src/common/logger.common';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly logger: LoggerCommonService,
    private readonly prisma: PrismaService,
  ) {}

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

    if (exception) {
      this.logger.logger.error('Error creating permission', {
        reason: exception.message,
      });
      throw exception;
    }

    this.logger.logger.info('Permission created', {
      name: data.name,
      route: data.route,
    });
  }

  async updatePermission(id: number, data: UpdatePermissionDTO) {
    try {
      await this.prisma.permission.update({
        data: data,
        where: { id },
      });

      this.logger.logger.info('Permission updated', {
        name: data.name,
        route: data.route,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          this.logger.logger.error('Error updating permission', {
            reason: 'Name of permission already exists.',
          });
          throw new HttpException(
            'Name of permission already exists.',
            HttpStatus.CONFLICT,
          );
        }

        if (error.code === 'P2025') {
          this.logger.logger.error('Error updating permission', {
            reason: 'Permission not found',
          });
          throw new HttpException('Permission not found', HttpStatus.NOT_FOUND);
        }
      }

      this.logger.logger.error('Error updating permission', {
        reason: 'An unexpected error occurred.',
      });

      throw new HttpException(
        'An unexpected error occurred.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deletePermission(id: number) {
    try {
      const permissionDeleted = await this.prisma.permission.delete({
        where: { id },
      });

      this.logger.logger.info('Permission deleted', {
        name: permissionDeleted.name,
        route: permissionDeleted.route,
      });
    } catch {
      this.logger.logger.error('Error deleting permission', {
        reason: 'Permission not found',
      });
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

    this.logger.logger.info('Role permission deleted', {
      roleId: id,
      permissionId: permissionId,
    });
  }
}
