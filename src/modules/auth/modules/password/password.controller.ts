import { Body, Controller, HttpCode, Post, Query } from '@nestjs/common';
import { PasswordService } from './password.service';
import { EmailDTO } from '../../dto/email.dto';
import { ConfirmChangePasswordDTO } from './dto/confirm-change-password.dto';

@Controller('auth/password')
export class PasswordController {
  constructor(private readonly passwordService: PasswordService) {}

  @Post('request-change')
  @HttpCode(200)
  requestChange(@Body() data: EmailDTO) {
    return this.passwordService.requestChange(data);
  }

  @Post('confirm-change')
  @HttpCode(200)
  confirmChange(
    @Body() data: ConfirmChangePasswordDTO,
    @Query('token') token: string,
  ) {
    return this.passwordService.confirmChange(data, token);
  }
}
