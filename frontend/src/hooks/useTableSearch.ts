'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function useTableSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';

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
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    router.push(`?${params.toString()}`);
  };

  return {
    searchTerm,
    buildUrl,
    handleSearchChange,
  };
}
