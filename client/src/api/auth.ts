import type { AuthUser, LoginResponse } from "../types/auth";

import { apiRequest } from "./client";

export function login(email: string, password: string) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    authenticated: false,
    body: JSON.stringify({ email, password })
  });
}

export function getCurrentUser() {
  return apiRequest<AuthUser>("/auth/me");
}

