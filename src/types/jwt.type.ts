export interface AccessTokenJwtPayloadI {
  email: string;
  role: string;
  roleId: number;
  iat: number;
  exp: number;
}
