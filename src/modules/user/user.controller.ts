import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { Roles } from 'src/decorators/role/role.decorator';
import { UserService } from './user.service';
import { Permissions } from 'src/decorators/permission/permission.decorator';
import { EnableTwoFactorAutenticationDTO } from './dto/enable-2fa.dto';
import { GetUser } from 'src/decorators/get-user/get-user.decorator';
import { JWTUserPayloadI } from 'src/types/jwt.type';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @Roles(['USER', 'ADMIN'])
  @Permissions(['View Users'])
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get(':id')
  @Roles(['USER', 'ADMIN'])
  @Permissions(['View Only User'])
  getInfoUser(@Param('id') id: string) {
    return this.userService.getInfoUser(Number(id));
  }

  @Patch('2fa/enable')
  enableTwoFactorAutentication(
    @GetUser() user: JWTUserPayloadI,
    @Body() data: EnableTwoFactorAutenticationDTO,
  ) {
    return this.userService.enableTwoFactorAutentication(user, data);
  }
}
