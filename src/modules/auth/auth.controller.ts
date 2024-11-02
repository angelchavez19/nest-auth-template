import { Response } from 'express';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAccountDTO } from './dto/create-account.dto';
import { LoginDTO } from './dto/login.dto';
import { RequestChangePasswordDTO } from './dto/request-change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('account')
  createAccount(@Body() data: CreateAccountDTO) {
    return this.authService.createAccount(data);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() data: LoginDTO, @Res() response: Response) {
    return this.authService.login(data, response);
  }

  @Get('confirm-email')
  @HttpCode(200)
  confirmEmail(@Query('token') token: string) {
    return this.authService.confirmEmail(token);
  }

  @Post('request-change-password')
  requestChangePassword(@Body() data: RequestChangePasswordDTO) {
    return this.authService.requestChangePassword(data);
  }
}
