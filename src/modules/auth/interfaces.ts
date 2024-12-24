export interface ExistingUserI {
  id: number;
  email: string;
  role: {
    name: string;
  };
  roleId: number;
  firstName: string;
  lastName: string;
  password: string;
  isEmailVerified: boolean;
  twoFactorSecret: string | null;
  twoFactorIV: string | null;
  twoFactorEnabled: boolean;
}
