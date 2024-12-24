export interface ExistingUserI {
  email: string;
  role: {
    name: string;
  };
  roleId: number;
  firstName: string;
  lastName: string;
  password: string;
  isEmailVerified: boolean;
}
