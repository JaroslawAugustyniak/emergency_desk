'use client';

import { useState, useEffect } from 'react';
import OrdersTable from '@/app/components/orders/OrdersTable';
import { useTranslations } from 'next-intl';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import { getOrders } from '@/lib/actions/orders';
import { getClients } from '@/lib/actions/clients';
import type { Order } from '@/lib/types/orders';

type Client = {
  id: number;
  name: string;
};

type PaginationData = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
};

export default function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; limit?: string; sort_by?: string; sort_order?: string; client_id?: string; location_id?: string }>;
}) {
  const t = useTranslations('orders');
  const { token, isLoading } = useSessionContext();

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [params, setParams] = useState<{
    page: number;
    search: string;
    limit: number;
    sort_by: string;
    sort_order: string;
    client_id?: number;
    location_id?: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const p = await searchParams;
      const clientId = p.client_id ? Number(p.client_id) : undefined;
      const locationId = p.location_id ? Number(p.location_id) : undefined;

      setParams({
        page: Number(p.page) || 1,
        search: p.search || '',
        limit: Number(p.limit) || 10,
        sort_by: p.sort_by || 'order_date',
        sort_order: p.sort_order || 'desc',
        client_id: clientId,
        location_id: locationId,
      });
    })();
  }, [searchParams]);

  // Fetch clients
  useEffect(() => {
    if (!token || isLoading) return;

    const fetchClients = async () => {
      try {
        const data = await getClients({ per_page: 100 }, token);
        setClients(data.data || []);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    fetchClients();
  }, [token, isLoading]);

  // Fetch orders
  useEffect(() => {
    if (!token || isLoading || !params) return;

    const fetchOrders = async () => {
      try {
        setIsLoadingData(true);
        const data = await getOrders(
          {
            page: params.page,
            per_page: params.limit,
            search: params.search || undefined,
            client_id: params.client_id,
            location_id: params.location_id,
            sort_by: params.sort_by as 'id' | 'order_number' | 'status' | 'order_date' | 'created_at' | undefined,
            sort_order: params.sort_order as 'asc' | 'desc' | undefined,
          },
          token
        );

        setOrders(data.data || []);
        setPagination({
          currentPage: data.pagination?.page || 1,
          totalPages: data.pagination?.last_page || 1,
          totalCount: data.pagination?.total || 0,
          limit: data.pagination?.per_page || params.limit,
        });
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchOrders();
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

      <OrdersTable
        orders={orders}
        pagination={pagination}
        sortBy={params?.sort_by}
        sortOrder={params?.sort_order}
        clients={clients}
      />
    </div>
  );
}
