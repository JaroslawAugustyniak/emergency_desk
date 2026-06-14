'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getNavHistory } from './NavigationTracker';

function popToPreviousPage(currentPathname: string): string | null {
  const history = getNavHistory();
  // Znajdź ostatni wpis z innym pathname niż bieżący
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i] !== currentPathname) {
      const truncated = history.slice(0, i + 1);
      sessionStorage.setItem('navHistory', JSON.stringify(truncated));
      return history[i];
    }
  }
  return null;
}

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const tCommon = useTranslations('common');

  const handleBack = () => {
    const target = popToPreviousPage(pathname);
    if (target) {
      router.push(target);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleBack}
      className="flex items-center cursor-pointer gap-2 p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ArrowLeft size={20} />
      {tCommon('back')}
    </button>
  );
}
