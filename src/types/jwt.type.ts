export interface JwtPayloadI {
  email: string;
  roleId: number;
  iat: number;
  exp: number;
}
