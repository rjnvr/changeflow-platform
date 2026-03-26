import type {
  BriefQuotaDashboard,
  ChangePasswordResponse,
  AuthUser,
  LoginResponse,
  PasswordResetRequestResponse,
  PasswordResetResponse
} from "../types/auth";

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

export function updateProfile(input: {
  email: string;
  firstName: string;
  lastName: string;
}) {
  return apiRequest<LoginResponse>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function register(input: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}) {
  return apiRequest<LoginResponse>("/auth/register", {
    method: "POST",
    authenticated: false,
    body: JSON.stringify(input)
  });
}

export function requestPasswordReset(email: string) {
  return apiRequest<PasswordResetRequestResponse>("/auth/request-password-reset", {
    method: "POST",
    authenticated: false,
    body: JSON.stringify({ email })
  });
}

export function resetPassword(input: { token: string; password: string }) {
  return apiRequest<PasswordResetResponse>("/auth/reset-password", {
    method: "POST",
    authenticated: false,
    body: JSON.stringify(input)
  });
}

export function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  return apiRequest<ChangePasswordResponse>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getBriefQuotaDashboard() {
  return apiRequest<BriefQuotaDashboard>("/auth/brief-quotas");
}

export function updateUserBriefQuota(userId: string, dailyProjectBriefLimit: number) {
  return apiRequest<{ id: string; dailyProjectBriefLimit: number }>(`/auth/users/${userId}/brief-quota`, {
    method: "PATCH",
    body: JSON.stringify({ dailyProjectBriefLimit })
  });
}

export function applyBriefQuotaToAll(dailyProjectBriefLimit: number) {
  return apiRequest<{ updatedCount: number; dailyProjectBriefLimit: number }>("/auth/brief-quotas/apply-to-all", {
    method: "PATCH",
    body: JSON.stringify({ dailyProjectBriefLimit })
  });
}
