'use client';

import { useLocale } from 'next-intl';
import { setLocale } from '@/actions/locale';
import { useTransition } from 'react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = async () => {
    const newLocale = locale === 'en' ? 'zh' : 'en';
    startTransition(async () => {
      await setLocale(newLocale);
      // Clear hash before reload to prevent auto-scroll
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      window.location.reload();
    });
  };

  return (
    <button className="lang-switcher" onClick={handleLanguageChange} disabled={isPending}>
      {isPending ? '...' : locale === 'en' ? '中文' : 'EN'}
    </button>
  );
}
