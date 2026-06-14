'use client';

import { useState, useEffect } from 'react';
import UsersTable from '@/app/components/users/UsersTable';
import { useTranslations } from 'next-intl';
import { useSessionContext } from '@/app/components/providers/SessionProvider';

type User = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
};

type PaginationData = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
};

export default function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; limit?: string; clientId?: string; role?: string; sort_by?: string; sort_order?: string }>;
}) {
  const t = useTranslations('users');
  const { token, isLoading } = useSessionContext();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [params, setParams] = useState<{ page: number; search: string; limit: number; clientId: string; role: string; sort_by: string; sort_order: string } | null>(null);

  useEffect(() => {
    (async () => {
      const p = await searchParams;
      setParams({
        page: Number(p.page) || 1,
        search: p.search || '',
        limit: Number(p.limit) || 10,
        clientId: p.clientId || '',
        role: p.role || '',
        sort_by: p.sort_by || 'first_name',
        sort_order: p.sort_order || 'asc',
      });
    })();
  }, [searchParams]);

  useEffect(() => {
    if (!token || isLoading || !params) return;

    const fetchUsers = async () => {
      try {
        setIsLoadingData(true);
        const queryParams = new URLSearchParams({
          page: String(params.page),
          per_page: String(params.limit),
        });

        if (params.search) {
          queryParams.append('search', params.search);
        }

        if (params.clientId) {
          queryParams.append('client_id', params.clientId);
        }

        if (params.role) {
          queryParams.append('role', params.role);
        }

        if (params.sort_by) {
          queryParams.append('sort_by', params.sort_by);
        }

        if (params.sort_order) {
          queryParams.append('sort_order', params.sort_order);
        }

        const res = await fetch(`/api/users?${queryParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await res.json();

        setUsers(data.data || []);
        setPagination({
          currentPage: data.pagination?.page || 1,
          totalPages: data.pagination?.last_page || 1,
          totalCount: data.pagination?.total || 0,
          limit: data.pagination?.per_page || params.limit,
        });
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchUsers();
  }, [token, isLoading, params]);

  if (isLoading || isLoadingData) {
    return (
      <div className="px-2 -mt-18">
        <h1 className="text-2xl font-bold mb-8">{t('title')}</h1>
        <div className="text-center py-8">Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="px-2 -mt-18">
      <h1 className="text-2xl font-bold mb-8">{t('title')}</h1>
      <UsersTable
        users={users}
        pagination={pagination}
        clientId={params.clientId ? Number(params.clientId) : undefined}
        selectedRole={params.role}
        sortBy={params.sort_by}
        sortOrder={params.sort_order}
      />
    </div>
  );
}
