'use client';

import { useState, useEffect } from 'react';

type User = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  client_id?: number | null;
};

type PaginationData = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
};

interface UseFetchUsersParams {
  token: string | null;
  isLoading: boolean;
  page: number;
  search: string;
  limit: number;
  clientId?: string;
  role?: string;
  sort_by?: string;
  sort_order?: string;
}

export function useFetchUsers({
  token,
  isLoading,
  page,
  search,
  limit,
  clientId = '',
  role = '',
  sort_by = 'first_name',
  sort_order = 'asc',
}: UseFetchUsersParams) {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  });
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!token || isLoading) return;

    const fetchUsers = async () => {
      try {
        setIsLoadingData(true);
        const queryParams = new URLSearchParams({
          page: String(page),
          per_page: String(limit),
        });

        if (search) {
          queryParams.append('search', search);
        }

        if (clientId) {
          queryParams.append('client_id', clientId);
        }

        if (role) {
          queryParams.append('role', role);
        }

        if (sort_by) {
          queryParams.append('sort_by', sort_by);
        }

        if (sort_order) {
          queryParams.append('sort_order', sort_order);
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
          limit: data.pagination?.per_page || limit,
        });
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchUsers();
  }, [token, isLoading, page, search, limit, clientId, role, sort_by, sort_order]);

  return { users, pagination, isLoadingData };
}
