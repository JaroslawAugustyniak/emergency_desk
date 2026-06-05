'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const SESSION_KEY = 'navHistory';
const MAX_ENTRIES = 50;

export function getNavHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]');
  } catch {
    return [];
  }
}

function setNavHistory(history: string[]) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(history));
}

export default function NavigationTracker() {
  const pathname = usePathname();
  const prevPathname = useRef<string | null>(null);

  useEffect(() => {
    if (prevPathname.current === null) {
      // Pierwsze renderowanie — inicjuj historię bieżącą ścieżką jeśli pusta
      const history = getNavHistory();
      if (history.length === 0) {
        setNavHistory([pathname]);
      }
      prevPathname.current = pathname;
      return;
    }

    if (pathname !== prevPathname.current) {
      const history = getNavHistory();
      const last = history[history.length - 1];

      if (last !== pathname) {
        const updated = [...history, pathname].slice(-MAX_ENTRIES);
        setNavHistory(updated);
      }

      prevPathname.current = pathname;
    }
  }, [pathname]);

  return null;
}
