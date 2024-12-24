import { IsString } from 'class-validator';

export class TwoFactorAutenticationDTO {
  @IsString()
  totpCode: string;
}
