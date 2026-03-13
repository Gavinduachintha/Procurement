import { apiRequest } from "./client";
import type { AuthResponse, User } from "../types/models";

export const authApi = {
  register(payload: {
    fullName: string;
    email: string;
    password: string;
    role: string;
    department?: string;
  }) {
    return apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: payload,
    });
  },

  login(payload: { email: string; password: string }) {
    return apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: payload,
    });
  },

  me(token: string) {
    return apiRequest<User>("/auth/me", { token });
  },

  usersByRole(token: string, role: string) {
    return apiRequest<User[]>(`/auth/users?role=${encodeURIComponent(role)}`, {
      token,
    });
  },
};
