import { IsEmail } from 'class-validator';

export class RequestTokenRefreshDTO {
  @IsEmail({}, { message: 'Invalid email format.' })
  email: string;
}
