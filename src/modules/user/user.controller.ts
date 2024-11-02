import { Controller, Get, Param } from '@nestjs/common';
import { Roles } from 'src/decorators/role/role.decorator';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @Roles(['USER'])
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get(':id')
  @Roles(['ADMIN'])
  getInfoUser(@Param('id') id: string) {
    return this.userService.getInfoUser(Number(id));
  }
}
