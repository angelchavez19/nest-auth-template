import { IsEmail } from 'class-validator';

export class RequestChangePasswordDTO {
  @IsEmail({}, { message: 'Invalid email format.' })
  email: string;
}
