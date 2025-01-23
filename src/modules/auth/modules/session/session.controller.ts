import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { LoginDTO } from './dto/login.dto';
import { Request, Response } from 'express';

@Controller('auth')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get('logout')
  logout(@Res() res: Response) {
    return this.sessionService.logout(res);
  }

  @Get('refresh-token')
  refreshToken(
    @Req() req: Request,
    @Res() res: Response,
    @Query('lang') lang: string,
  ) {
    return this.sessionService.refreshToken(req, res, lang);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() data: LoginDTO, @Res() res: Response) {
    return this.sessionService.login(data, res);
  }
}
