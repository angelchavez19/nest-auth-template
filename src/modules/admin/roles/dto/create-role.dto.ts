import { IsNotEmpty, IsString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePermissionsDTO } from './create-permissions.dto';

export class CreateRoleDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePermissionsDTO)
  permissions: CreatePermissionsDTO[];
}
