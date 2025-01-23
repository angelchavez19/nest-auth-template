import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { GetUser } from 'src/decorators/get-user/get-user.decorator';
import { JWTUserPayloadI } from 'src/types/jwt.type';

@Controller('auth/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('info')
  getInfoUser(@GetUser() user: JWTUserPayloadI) {
    return this.userService.getInfoUser(user);
  }
}
