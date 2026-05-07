'use client';

import { useTransition, useState, useEffect } from 'react';
import { setTheme } from '@/actions/theme';
import { type Theme, THEMES } from '@/constants/theme';

const THEME_ICONS: Record<Theme, string> = {
  hacker: '⚡',
  'dark-modern': '🌌',
  light: '☀️',
};

const THEME_LABELS: Record<Theme, string> = {
  hacker: 'Hacker',
  'dark-modern': 'Modern',
  light: 'Light',
};

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('hacker');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const theme = (document.documentElement.getAttribute('data-theme') as Theme) || 'hacker';
    setCurrentTheme(theme);
  }, []);

  const handleThemeChange = () => {
    const idx = THEMES.indexOf(currentTheme);
    const next = THEMES[(idx + 1) % THEMES.length];
    startTransition(async () => {
      await setTheme(next);
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      window.location.reload();
    });
  };

  return (
    <button
      className="theme-switcher"
      onClick={handleThemeChange}
      disabled={isPending}
      aria-label={`Switch theme (current: ${THEME_LABELS[currentTheme]})`}
      title={THEME_LABELS[currentTheme]}
      suppressHydrationWarning
    >
      {isPending ? '...' : THEME_ICONS[currentTheme]}
    </button>
  );
}
