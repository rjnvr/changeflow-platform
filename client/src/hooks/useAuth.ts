import { startTransition, useEffect, useState } from "react";

import { getCurrentUser, login as loginRequest } from "../api/auth";
import type { AuthUser } from "../types/auth";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from "../utils/constants";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedUser = localStorage.getItem(AUTH_USER_KEY);
    return storedUser ? (JSON.parse(storedUser) as AuthUser) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token || user) {
      return;
    }

    setLoading(true);
    getCurrentUser()
      .then((currentUser) => {
        startTransition(() => {
          setUser(currentUser);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
        });
      })
      .finally(() => setLoading(false));
  }, [user]);

  async function login(email: string, password: string) {
    setLoading(true);

    try {
      const response = await loginRequest(email, password);

      localStorage.setItem(AUTH_TOKEN_KEY, response.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));

      startTransition(() => {
        setUser(response.user);
      });

      return response.user;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    startTransition(() => setUser(null));
  }

  return {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    logout
  };
}

