import { createContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { authApi } from "../api/authApi";
import type { AuthResponse, User } from "../types/models";

type AuthContextShape = {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    fullName: string;
    email: string;
    password: string;
    role: string;
    department?: string;
  }) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextShape | null>(null);

const TOKEN_KEY = "procurement_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem(TOKEN_KEY),
  );
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const applyAuth = (data: AuthResponse) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem(TOKEN_KEY, data.token);
  };

  const clearAuth = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  useEffect(() => {
    const hydrate = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const me = await authApi.me(token);
        setUser(me);
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    void hydrate();
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login: async (email: string, password: string) => {
        const data = await authApi.login({ email, password });
        applyAuth(data);
      },
      register: async (payload: {
        fullName: string;
        email: string;
        password: string;
        role: string;
        department?: string;
      }) => {
        const data = await authApi.register(payload);
        applyAuth(data);
      },
      logout: clearAuth,
    }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
