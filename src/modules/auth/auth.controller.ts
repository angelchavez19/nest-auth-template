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
import { ConfirmChangePasswordDTO } from './dto/confirm-change-password.dto';
import { LoginDTO } from './dto/login.dto';
import { RequestTokenRefreshDTO } from './dto/request-refresh-token.dto';

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

  @Get('logout')
  @HttpCode(200)
  logout(@Res() response: Response) {
    return this.authService.logout(response);
  }

  @Get('confirm-email')
  @HttpCode(200)
  confirmEmail(@Query('token') token: string) {
    return this.authService.confirmEmail(token);
  }

  @Post('request-refresh-account-creation-token')
  @HttpCode(200)
  requestRefreshAccountCreationToken(@Body() data: RequestTokenRefreshDTO) {
    return this.authService.requestRefreshAccountCreationToken(data);
  }

  @Post('request-change-password')
  @HttpCode(200)
  requestChangePassword(@Body() data: RequestTokenRefreshDTO) {
    return this.authService.requestChangePassword(data);
  }

  @Post('confirm-change-password')
  @HttpCode(200)
  confirmChangePassword(
    @Body() data: ConfirmChangePasswordDTO,
    @Query('token') token: string,
  ) {
    return this.authService.confirmChangePassword(data, token);
  }
}
