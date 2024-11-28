import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateRoleNameDTO {
  @IsNotEmpty()
  @IsString()
  name: string;
}
