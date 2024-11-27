import { IsNotEmpty, IsString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePermissionDTO } from '../../permissions/dto/create-permission.dto';

export class CreateRoleDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePermissionDTO)
  permissions: CreatePermissionDTO[];
}
