import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { Roles } from 'src/decorators/role/role.decorator';
import { CreatePermissionDTO } from './dto/create-permission.dto';
import { UpdatePermissionDTO } from './dto/update-permission.dto';

@Controller('admin/permissions')
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @Get(':roleId')
  @Roles(['ADMIN'])
  getAllPermissions(@Param('roleId', ParseIntPipe) id: number) {
    return this.permissionsService.getAllPermissions(id);
  }

  @Post(':roleId')
  @Roles(['ADMIN'])
  createPermission(
    @Param('roleId', ParseIntPipe) id: number,
    @Body() data: CreatePermissionDTO,
  ) {
    return this.permissionsService.createPermission(id, data);
  }

  @Patch(':permissionId')
  @Roles(['ADMIN'])
  updatePermission(
    @Param('permissionId', ParseIntPipe) id: number,
    @Body() data: UpdatePermissionDTO,
  ) {
    return this.permissionsService.updatePermission(id, data);
  }

  @Delete(':permissionId')
  @Roles(['ADMIN'])
  deletePermission(@Param('permissionId', ParseIntPipe) permissionId: number) {
    return this.permissionsService.deletePermission(permissionId);
  }

  @Delete(':roleId/:permissionId')
  @Roles(['ADMIN'])
  deleteRolePermission(
    @Param('roleId', ParseIntPipe) id: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    return this.permissionsService.deleteRolePermission(id, permissionId);
  }
}
