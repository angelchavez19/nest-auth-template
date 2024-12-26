import { Controller, Get, Query, Res } from '@nestjs/common';
import { SocialService } from './social.service';
import { Response } from 'express';

@Controller('auth/social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('github')
  githubLogin(@Res() response: Response, @Query('code') code: string) {
    return this.socialService.githubLogin(response, code);
  }

  @Get('google')
  googleLogin(@Res() response: Response, @Query('code') code: string) {
    return this.socialService.googleLogin(response, code);
  }
}
