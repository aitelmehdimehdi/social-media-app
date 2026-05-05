import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { apiGet, apiPost, setToken, removeToken, setUnauthorizedHandler } from "../utils/api";

// ─── Static mock users (commented out — replaced by real API) ─────────────────
// import users from "../data/users.json";

// ─── Types ────────────────────────────────────────────────────────────────────

type User = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar: string | null;
};

type RegisterData = {
  username: string;
  email: string;
  password: string;
  fullName: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = "@instagram_user";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(SESSION_KEY);
        if (saved) setUser(JSON.parse(saved) as User);
      } catch (_) {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Any 401 from the API automatically clears the session
  useEffect(() => {
    setUnauthorizedHandler(() => {
      AsyncStorage.removeItem(SESSION_KEY);
      setUser(null);
    });
  }, []);

  // ── Login — calls real API ─────────────────────────────────────────────────
  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await apiPost<{ token: string; user: User }>("/auth/login", {
        email,
        password,
      });

      await setToken(data.token);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Login failed",
      };
    }
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const register = async (
    data: RegisterData,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiPost<{ token: string; user: User }>("/auth/register", data);
      await setToken(result.token);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
      setUser(result.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Registration failed",
      };
    }
  };

  // ── Refresh — re-fetches the logged-in user from the API ──────────────────
  const refreshUser = async () => {
    try {
      const fresh = await apiGet<User>('/users/me');
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(fresh));
      setUser(fresh);
    } catch (_) {}
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    await removeToken();
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
