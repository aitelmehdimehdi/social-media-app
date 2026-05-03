import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Theme = "light" | "dark";

export type ColorPalette = typeof LIGHT_COLORS;

type ThemeContextType = {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  colors: ColorPalette;
};

// ─── Palettes ─────────────────────────────────────────────────────────────────

export const LIGHT_COLORS = {
  background: "#FAFAFA",
  card: "#FFFFFF",
  border: "#E8E8E8",
  text: "#1A1A1A",
  textSecondary: "#8A8A8A",
  inputBg: "#F4F4F4",
  iconActive: "#1A1A1A",
  iconInactive: "#ABABAB",
  tabBar: "#FFFFFF",
  storyRing: "#7C3AED",
  like: "#FF385C",
  primary: "#7C3AED",
  surface: "#F0F0F0",
  overlay: "rgba(0,0,0,0.45)",
};

export const DARK_COLORS: ColorPalette = {
  background: "#0D0D0D",
  card: "#1A1A1A",
  border: "#2E2E2E",
  text: "#F0F0F0",
  textSecondary: "#909090",
  inputBg: "#1A1A1A",
  iconActive: "#F0F0F0",
  iconInactive: "#606060",
  tabBar: "#0D0D0D",
  storyRing: "#9D6EFF",
  like: "#FF385C",
  primary: "#9D6EFF",
  surface: "#252525",
  overlay: "rgba(0,0,0,0.7)",
};

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_KEY = "@instagram_theme";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  // Restaure le thème sauvegardé au démarrage
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === "dark" || saved === "light") setTheme(saved);
    });
  }, []);

  const toggleTheme = async () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    await AsyncStorage.setItem(THEME_KEY, next);
  };

  const colors = theme === "dark" ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider
      value={{ theme, isDark: theme === "dark", toggleTheme, colors }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
