"use client";

import { useEffect, useSyncExternalStore, useCallback } from "react";

type Theme = "light" | "dark";

const emptySubscribe = () => () => {};

const themeListeners = new Set<() => void>();
let cachedTheme: Theme | null = null;

function subscribeToTheme(callback: () => void) {
  themeListeners.add(callback);
  return () => {
    themeListeners.delete(callback);
  };
}

function getThemeSnapshot(): Theme {
  if (cachedTheme === null) {
    cachedTheme = (localStorage.getItem("theme") as Theme) || "dark";
  }
  return cachedTheme;
}

function updateTheme(theme: Theme) {
  cachedTheme = theme;
  localStorage.setItem("theme", theme);
  themeListeners.forEach((listener) => listener());
}

export function useTheme() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    () => "dark" as Theme,
  );

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme, mounted]);

  const toggle = useCallback(() => {
    updateTheme(theme === "dark" ? "light" : "dark");
  }, [theme]);

  return { theme, toggle, mounted };
}
