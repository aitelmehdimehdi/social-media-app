import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import users from "../data/users.json";

// ─── Types ────────────────────────────────────────────────────────────────────

type User = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = "@instagram_user";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true); // true pendant la vérification initiale

  // Restaure la session au démarrage
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(SESSION_KEY);
        if (saved) setUser(JSON.parse(saved));
      } catch (_) {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    // Cherche dans users.json (email OU username accepté)
    const found = (users as any[]).find(
      (u) =>
        (u.email.toLowerCase() === email.toLowerCase() ||
          u.username.toLowerCase() === email.toLowerCase()) &&
        u.password === password,
    );

    if (!found) {
      return { success: false, error: "Email ou mot de passe incorrect." };
    }

    // Sauvegarde la session (sans le mot de passe)
    const sessionUser: User = {
      id: found.id,
      username: found.username,
      email: found.email,
      fullName: found.fullName,
      avatar: found.avatar,
    };

    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return { success: true };
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
