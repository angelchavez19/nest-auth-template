import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { Roles } from 'src/decorators/role/role.decorator';
import { CreateRoleDTO } from './dto/create-role.dto';
import { UpdateRoleNameDTO } from './dto/update-role-name.dto';
import { AssignRoleDTO } from './dto/assign-role.dto';

@Controller('admin/roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @Roles(['ADMIN'])
  getAllRoles() {
    return this.rolesService.getAllRoles();
  }

  @Post()
  @Roles(['ADMIN'])
  createRole(@Body() data: CreateRoleDTO) {
    return this.rolesService.createRole(data);
  }

  @Patch(':id')
  @Roles(['ADMIN'])
  updateRoleName(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateRoleNameDTO,
  ) {
    return this.rolesService.updateRoleName(id, data);
  }

  @Delete(':id')
  @Roles(['ADMIN'])
  deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.deleteRole(id);
  }

  @Put('/assign')
  @Roles(['ADMIN'])
  assignRole(@Body() data: AssignRoleDTO) {
    return this.rolesService.assignRole(data);
  }
}
