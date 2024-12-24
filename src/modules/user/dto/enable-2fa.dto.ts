import { IsBoolean } from 'class-validator';

export class EnableTwoFactorAutenticationDTO {
  @IsBoolean()
  enable: boolean;
}
