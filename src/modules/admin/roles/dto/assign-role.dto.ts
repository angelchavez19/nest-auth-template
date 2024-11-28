import { IsInt, IsPositive } from 'class-validator';

export class AssignRoleDTO {
  @IsInt({ message: 'The roleId must be an integer.' })
  @IsPositive({ message: 'The roleId must be a positive number.' })
  roleId: number;

  @IsInt({ message: 'The userId must be an integer.' })
  @IsPositive({ message: 'The userId must be a positive number.' })
  userId: number;
}
