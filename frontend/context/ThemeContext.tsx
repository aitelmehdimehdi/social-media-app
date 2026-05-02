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
  background: "#ffffff",
  card: "#ffffff",
  border: "#dbdbdb",
  text: "#262626",
  textSecondary: "#8e8e8e",
  inputBg: "#fafafa",
  iconActive: "#000000",
  iconInactive: "#8e8e8e",
  tabBar: "#ffffff",
  storyRing: "#c13584",
  like: "#ed4956",
  primary: "#0095f6",
  surface: "#efefef",
  overlay: "rgba(0,0,0,0.45)",
};

export const DARK_COLORS: ColorPalette = {
  background: "#000000",
  card: "#1c1c1c",
  border: "#2c2c2c",
  text: "#f5f5f5",
  textSecondary: "#a0a0a0",
  inputBg: "#1c1c1c",
  iconActive: "#ffffff",
  iconInactive: "#707070",
  tabBar: "#000000",
  storyRing: "#c13584",
  like: "#ed4956",
  primary: "#0095f6",
  surface: "#2a2a2a",
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
