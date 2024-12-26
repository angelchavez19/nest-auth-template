import { IsEmail } from 'class-validator';

export class EmailDTO {
  @IsEmail({}, { message: 'Invalid email format.' })
  email: string;
}
