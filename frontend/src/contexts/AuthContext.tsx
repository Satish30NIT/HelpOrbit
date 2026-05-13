"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AuthUser,
  clearSession,
  getToken,
  getUser,
  setSession,
} from "@/lib/auth";
import { api } from "@/lib/api";

type LoginResponse = {
  success: boolean;
  data: { token: string; user: AuthUser };
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean; // initial hydration from localStorage
  login: (identifier: string, password: string) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getUser());
    setToken(getToken());
    setLoading(false);
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await api.post<LoginResponse>(
      "/auth/login",
      { identifier, password },
      { auth: false }
    );
    const { token: newToken, user: newUser } = res.data;
    setSession(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
