'use client';

import { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();

  const changeLocale = (newLocale: string) => {
    startTransition(() => {
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
      window.location.reload();
    });
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => changeLocale(locale === 'pl' ? 'en' : 'pl')}
        disabled={isPending}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
        title={locale === 'pl' ? 'Switch to English' : 'Przełącz na polski'}
      >
        <Globe size={18} />
        <span className="uppercase font-semibold">{locale}</span>
      </button>
    </div>
  );
}
