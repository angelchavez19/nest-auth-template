import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateAccountDTO {
  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long.' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters.' })
  firstName: string;

  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long.' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters.' })
  lastName: string;

  @IsEmail({}, { message: 'Invalid email format.' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(255, { message: 'Password must not exceed 255 characters.' })
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).*$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
  })
  password: string;

  @IsOptional()
  @IsNumber({}, { message: 'RoleId must be a number.' })
  roleId?: number;
}
