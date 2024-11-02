import { Response } from 'express';
import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAccountDTO } from './dto/create-account.dto';
import { LoginDTO } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('account')
  createAccount(@Body() data: CreateAccountDTO) {
    this.authService.createAccount(data);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() data: LoginDTO, @Res() response: Response) {
    this.authService.login(data, response);
  }
}
