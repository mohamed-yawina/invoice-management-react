import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { getPalette, getGradients, applyThemeCssVariables } from '../theme/palettes';
import { createAppTheme } from '../theme/createAppTheme';

export const THEME_STORAGE_KEY = 'facturepro-theme-mode';

const ThemeModeContext = createContext(null);

function readInitialMode() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(readInitialMode);

  const palette = useMemo(() => getPalette(mode), [mode]);
  const gradients = useMemo(() => getGradients(mode), [mode]);
  const muiTheme = useMemo(() => createAppTheme(mode), [mode]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
    applyThemeCssVariables(mode);
  }, [mode]);

  const setThemeMode = useCallback((next) => {
    setMode(next === 'dark' ? 'dark' : 'light');
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((m) => (m === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(() => ({
    mode,
    isDark: mode === 'dark',
    palette,
    gradients,
    setThemeMode,
    toggleTheme,
  }), [mode, palette, gradients, setThemeMode, toggleTheme]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={muiTheme}>
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) {
    throw new Error('useThemeMode must be used within ThemeModeProvider');
  }
  return ctx;
}

/** Lecture du mode sans contexte (Login / Register). */
export function getStoredThemeMode() {
  return readInitialMode();
}
