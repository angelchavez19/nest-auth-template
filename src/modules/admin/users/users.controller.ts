import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from 'src/decorators/role/role.decorator';

@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(['ADMIN'])
  findAll() {
    return this.usersService.findAll();
  }
}
