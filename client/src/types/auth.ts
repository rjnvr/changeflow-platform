export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "project_manager" | "accounting";
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface PasswordResetRequestResponse {
  message: string;
  previewToken?: string;
}

export interface PasswordResetResponse {
  message: string;
}

export interface ChangePasswordResponse {
  message: string;
}
