import { API_BASE_URL, AUTH_TOKEN_KEY } from "../utils/constants";

interface RequestOptions extends RequestInit {
  authenticated?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (options.authenticated !== false) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const payload = (await response.json()) as {
    success: boolean;
    data?: T;
    message?: string;
  };

  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? "Request failed.");
  }

  return payload.data as T;
}

