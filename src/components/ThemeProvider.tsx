"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

export type Theme = "sakura" | "dark" | "light" | "linen" | "forest";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({ theme: "linen", setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>("linen");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("catforcat-theme") as Theme | null;
      if (
        saved === "sakura" ||
        saved === "dark" ||
        saved === "light" ||
        saved === "linen" ||
        saved === "forest"
      ) {
        setThemeState(saved);
        document.documentElement.setAttribute("data-theme", saved);
      } else {
        document.documentElement.setAttribute("data-theme", "linen");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("catforcat-theme", next);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
