'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';

export function useTableSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';
  const [displayValue, setDisplayValue] = useState(searchTerm);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsLoadingSearch(false);
  }, [searchParams]);

  const buildUrl = (page: number, limit?: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    if (limit) {
      params.set('limit', limit.toString());
    }
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    return `?${params.toString()}`;
  };

  const handleSearchChange = (value: string) => {
    setDisplayValue(value);
    setIsLoadingSearch(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      params.set('page', '1');
      if (value) {
        params.set('search', value);
      } else {
        params.delete('search');
      }
      router.push(`?${params.toString()}`);
      debounceTimerRef.current = null;
    }, 1500);
  };

  return {
    searchTerm: displayValue,
    isLoadingSearch,
    buildUrl,
    handleSearchChange,
  };
}
