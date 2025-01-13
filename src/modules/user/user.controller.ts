import { Controller, Get, Param } from '@nestjs/common';
import { Roles } from 'src/decorators/role/role.decorator';
import { UserService } from './user.service';
import { Permissions } from 'src/decorators/permission/permission.decorator';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @Roles(['ADMIN'])
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get(':id')
  @Roles(['USER', 'ADMIN'])
  @Permissions(['VIEW USER INFO'])
  getInfoUser(@Param('id') id: string) {
    return this.userService.getInfoUser(Number(id));
  }
}
