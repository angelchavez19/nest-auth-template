import { IsString } from 'class-validator';

export class SocialLoginDTO {
  @IsString()
  code: string;
}
