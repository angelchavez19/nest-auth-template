import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDTO } from './dto/create-account.dto';
import { EmailDTO } from '../../dto/email.dto';

@Controller('auth/account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('confirm')
  confirmEmail(@Query('token') token: string) {
    return this.accountService.confirmEmail(token);
  }

  @Post('')
  @HttpCode(200)
  createAccount(@Body() data: CreateAccountDTO) {
    return this.accountService.createAccount(data);
  }

  @Post('refresh-token')
  @HttpCode(200)
  refreshToken(@Body() data: EmailDTO) {
    return this.accountService.refreshToken(data);
  }
}
