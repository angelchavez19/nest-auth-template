export interface AccessTokenJwtPayloadI {
  email: string;
  roleId: number;
  iat: number;
  exp: number;
}
