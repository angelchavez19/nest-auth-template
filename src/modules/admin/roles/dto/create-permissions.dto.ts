import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreatePermissionsDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\/[a-zA-Z0-9\/:_*]*$/, {
    message: 'Route must be a valid path (e.g., /user/:id or /user/*)',
  })
  route: string;
}
