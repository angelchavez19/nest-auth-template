import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAccountDTO } from './dto/create-account.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('account')
  createAccount(@Body() data: CreateAccountDTO) {
    this.authService.createAccount(data);
  }
}
