import { startTransition, useEffect, useState } from "react";

import {
  changePassword as changePasswordRequest,
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
  updateProfile as updateProfileRequest
} from "../api/auth";
import type { AuthUser } from "../types/auth";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from "../utils/constants";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const storedUser = localStorage.getItem(AUTH_USER_KEY);

    if (!storedUser) {
      return null;
    }

    const parsedUser = JSON.parse(storedUser) as Partial<AuthUser>;

    if (!parsedUser.id || !parsedUser.email || !parsedUser.role || !parsedUser.firstName || !parsedUser.lastName) {
      return null;
    }

    return parsedUser as AuthUser;
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

  async function register(input: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  }) {
    setLoading(true);

    try {
      const response = await registerRequest(input);

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

  async function updateProfile(input: {
    email: string;
    firstName: string;
    lastName: string;
  }) {
    setLoading(true);

    try {
      const response = await updateProfileRequest(input);

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

  async function changePassword(input: {
    currentPassword: string;
    newPassword: string;
  }) {
    setLoading(true);

    try {
      return await changePasswordRequest(input);
    } finally {
      setLoading(false);
    }
  }

  return {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    updateProfile,
    changePassword,
    logout
  };
}
