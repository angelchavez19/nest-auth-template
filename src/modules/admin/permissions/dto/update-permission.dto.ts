import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class UpdatePermissionDTO {
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  name?: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  @Matches(/^\/[a-zA-Z0-9\/:_*]*$/, {
    message: 'Route must be a valid path (e.g., /user/:id or /user/*)',
  })
  route?: string;
}
