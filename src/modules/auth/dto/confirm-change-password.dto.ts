import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ConfirmChangePasswordDTO {
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(255, { message: 'Password must not exceed 255 characters.' })
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).*$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
  })
  password: string;
}
