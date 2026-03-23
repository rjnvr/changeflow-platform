export interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "project_manager" | "accounting";
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

