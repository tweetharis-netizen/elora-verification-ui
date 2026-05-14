import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { UserRole } from '../lib/llm/types';
import { loadSettings } from '../services/settingsService';
import { darkTheme, lightTheme, ThemeName, ThemeTokens } from './colors';

type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  themeName: ThemeName;
  theme: ThemeTokens;
  preferredTheme: ThemePreference;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(preference: ThemePreference): ThemeName {
  if (preference === 'dark') return 'dark';
  if (preference === 'light') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDocument(themeName: ThemeName, theme: ThemeTokens) {
  const root = document.documentElement;
  root.setAttribute('data-theme', themeName);
  root.style.setProperty('--elora-bg', theme.appBg);
  root.style.setProperty('--elora-surface-main', theme.cardBg);
  root.style.setProperty('--elora-surface-alt', theme.cardBgMuted);
  root.style.setProperty('--elora-border-subtle', theme.cardBorder);
  root.style.setProperty('--elora-text-strong', theme.textPrimary);
  root.style.setProperty('--elora-text-muted', theme.textSecondary);
}

export function ThemeProvider({ role, children }: { role?: UserRole | null; children: React.ReactNode }) {
  const [preferredTheme, setPreferredTheme] = useState<ThemePreference>('system');
  const [themeName, setThemeName] = useState<ThemeName>(() => resolveTheme('system'));

  useEffect(() => {
    if (!role) {
      setPreferredTheme('system');
      setThemeName(resolveTheme('system'));
      return;
    }

    const settings = loadSettings(role);
    const preference = settings.preferredTheme ?? 'system';
    setPreferredTheme(preference);
    setThemeName(resolveTheme(preference));
  }, [role]);

  useEffect(() => {
    const onSettingsUpdated = (event: Event) => {
      const detail = (event as CustomEvent).detail as { role?: UserRole; preferredTheme?: ThemePreference } | undefined;
      if (!role || !detail || detail.role !== role) return;
      const nextPreference = detail.preferredTheme ?? 'system';
      setPreferredTheme(nextPreference);
      setThemeName(resolveTheme(nextPreference));
    };

    window.addEventListener('elora-settings-updated', onSettingsUpdated as EventListener);
    return () => window.removeEventListener('elora-settings-updated', onSettingsUpdated as EventListener);
  }, [role]);

  useEffect(() => {
    if (preferredTheme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setThemeName(e.matches ? 'dark' : 'light');
    };

    // Check current state first
    setThemeName(mediaQuery.matches ? 'dark' : 'light');

    // Use both addListener (legacy) and addEventListener (modern) for compatibility
    if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    }
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange as any);
      }
      mediaQuery.removeEventListener('change', handleChange as any);
    };
  }, [preferredTheme]);

  const theme = themeName === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    applyThemeToDocument(themeName, theme);
  }, [themeName, theme]);

  const value = useMemo(
    () => ({
      themeName,
      theme,
      preferredTheme,
    }),
    [themeName, theme, preferredTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useEloraTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useEloraTheme must be used within ThemeProvider.');
  }
  return ctx;
}
