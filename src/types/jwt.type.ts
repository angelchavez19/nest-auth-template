export interface JWTUserPayloadI {
  id: number;
  email: string;
  role: string;
  roleId: number;
  iat: number;
  exp: number;
}
