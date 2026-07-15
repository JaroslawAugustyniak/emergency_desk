'use client';

import { useState, useEffect } from 'react';
import { Edit, Trash2, ArrowUpDown, Plus, Loader, UserPlus } from 'lucide-react';
import OrderFormModal from '@/app/components/orders/OrderFormModal';
import AssignTechnicianModal from '@/app/components/orders/AssignTechnicianModal';
import FormattedOrderNumber from '@/app/components/orders/FormattedOrderNumber';
import Pagination from '@/app/components/ui/Pagination';
import { deleteOrder } from '@/lib/actions/orders';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTableSearch } from '@/hooks/useTableSearch';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import { getLocationsByClient } from '@/lib/actions/locations';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import type { Order } from '@/lib/types/orders';

type Pagination = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
};

type SortField = 'order_number' | 'status' | 'order_date' | 'created_at';

type Client = {
  id: number;
  name: string;
};

type Location = {
  id: number;
  name: string;
  address: string;
  number: string;
  zip: string;
  city: string;
  country?: string;
  nip?: string;
};

const statusColors: Record<string, string> = {
  new: 'bg-gray-100 text-gray-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  paused: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  invoiced: 'bg-purple-100 text-purple-800',
};

export default function OrdersTable({
  orders,
  pagination,
  sortBy = 'order_date',
  sortOrder = 'desc',
  clients,
}: {
  orders: Order[];
  pagination: Pagination;
  sortBy?: string;
  sortOrder?: string;
  clients: Client[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');
  const { token } = useSessionContext();
  const { searchTerm, isLoadingSearch, buildUrl, handleSearchChange } = useTableSearch();
  const { handleDelete } = useDeleteHandler({
    resourceKey: 'orders',
    deleteFunction: deleteOrder,
    onSuccess: () => router.refresh(),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState<Order | null>(null);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Initialize filters from URL params (only on mount)
  useEffect(() => {
    const clientId = searchParams.get('client_id');
    const locationId = searchParams.get('location_id');

    if (clientId) {
      setSelectedClient(Number(clientId));
    }
    if (locationId) {
      setSelectedLocation(Number(locationId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch locations when client is selected
  useEffect(() => {
    if (!token || !selectedClient) {
      setLocations([]);
      return;
    }

    const fetchLocations = async () => {
      try {
        setIsLoadingLocations(true);
        const data = await getLocationsByClient(selectedClient, token);
        setLocations(data.data || []);
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setIsLoadingLocations(false);
      }
    };

    fetchLocations();
  }, [selectedClient, token]);

  const handleClientChange = (clientId: string) => {
    const id = clientId ? Number(clientId) : null;
    setSelectedClient(id);
    setSelectedLocation(null);
    setLocations([]);

    const params = new URLSearchParams(window.location.search);
    if (id) {
      params.set('client_id', String(id));
    } else {
      params.delete('client_id');
    }
    params.delete('location_id');
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handleLocationChange = (locationId: string) => {
    const id = locationId ? Number(locationId) : null;
    setSelectedLocation(id);

    const params = new URLSearchParams(window.location.search);
    if (id) {
      params.set('location_id', String(id));
    } else {
      params.delete('location_id');
    }
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const showFilters = true; //!searchParams.get('location_id');
  const showClientFilter = true; //!searchParams.get('client_id') && !searchParams.get('location_id');
  const showLocationFilter = true; //searchParams.get('client_id') || selectedClient;

  const handleSort = (field: SortField) => {
    const params = new URLSearchParams(window.location.search);
    const newSortOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    params.set('sort_by', field);
    params.set('sort_order', newSortOrder);
    router.push(`?${params.toString()}`);
  };

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedOrder(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleAssignTechnician = (order: Order) => {
    setOrderToAssign(order);
    setIsAssignModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setOrderToAssign(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };


  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      new: t('statusNew'),
      assigned: t('statusAssigned'),
      in_progress: t('statusInProgress'),
      paused: t('statusPaused'),
      completed: t('statusCompleted'),
      invoiced: t('statusInvoiced'),
    };
    return labels[status] || status;
  };

  return (
    <div className="w-full">
      

      {/* Search bar and Add button */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full max-w-sm">
          <input
            type="text"
            placeholder={t('search')}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
          />
          {isLoadingSearch && (
            <Loader className="w-5 h-5 text-gray-400 animate-spin shrink-0" />
          )}
        </div>

        {/* Filters */}
          
            {showClientFilter && (
              <div className='flex items-center gap-2 max-w-sm'>
                <label htmlFor="client" className="text-sm text-gray-600">
                  {t('client')}
                </label>
                <select
                  id="client"
                  value={selectedClient || ''}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{tCommon('selectOption')}</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {showLocationFilter && (
              <div className='flex items-center gap-2'>
                <label htmlFor="location" className="text-sm text-gray-600">
                  {t('location')}
                </label>
                <select
                  id="location"
                  value={selectedLocation || ''}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  disabled={!selectedClient}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  <option value="">{tCommon('selectOption')}</option>
                  {isLoadingLocations ? (
                    <option disabled>Ładowanie...</option>
                  ) : (
                    locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.address} {location.number}
                        {location.city && ` - ${location.city}`}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <label htmlFor="limit" className="text-sm text-gray-600">
                {tCommon('itemsPerPage')}
              </label>
              <select
                id="limit"
                value={pagination.limit}
                onChange={(e) => {
                  const newLimit = Number(e.target.value);
                  router.push(buildUrl(1, newLimit));
                }}
                className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black text-sm"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>          
        

        <div className="flex flex-wrap items-center justify-end gap-3 float-end w-full ">
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            {t('addNew')}
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-gray-200">
          <thead className="bg-gray-50">
            <tr>

              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('order_number')}
              >
                <div className="flex items-center gap-2">
                  {t('orderNumber')}
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('client')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-2">
                  {t('status')}
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('order_date')}
              >
                <div className="flex items-center gap-2">
                  {t('orderDate')}
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tCommon('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  {t('noOrders')}
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <FormattedOrderNumber
                        clientId={order.client_id}
                        locationId={order.location_id}
                        orderId={order.id}
                      />
                      {order.is_emergency && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                          🚨 {t('emergency')}
                        </span>
                      )}
                    </div>
                  </td>
 
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {order.client?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                      {getStatusLabel(order.status)}
                      {order.is_emergency && <span className="ml-1">🚨</span>}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {order.status === 'new' || order.status === 'assigned' && (
                        <div className="relative group">
                          <button
                            onClick={() => handleAssignTechnician(order)}
                            className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                            title={t('assignTechnician')}
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                          <span className="tooltip tooltip-top-right">
                            {t('assignTechnician')}
                          </span>
                        </div>
                      )}
                      <div className="relative group">
                        <button
                          onClick={() => handleEdit(order)}
                          className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          title={tCommon('edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <span className="tooltip tooltip-top-right">
                          {tCommon('edit')}
                        </span>
                      </div>
                      <div className="relative group">
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          title={tCommon('delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <span className="tooltip tooltip-top-right">
                          {tCommon('delete')}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {orders.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            {t('noOrders')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-gray-200 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
              >
                <div className="mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      <FormattedOrderNumber
                        clientId={order.client_id}
                        locationId={order.location_id}
                        orderId={order.id}
                      />
                    </h3>
                    {order.is_emergency && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                        🚨 {t('emergency')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-3 pb-3 border-b border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">{t('client')}</p>
                  <p className="text-sm text-gray-600">{order.client?.name || '-'}</p>
                </div>

                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">{t('status')}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    {order.is_emergency && <span>🚨</span>}
                  </div>
                </div>

                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">{t('orderDate')}</p>
                  <p className="text-sm text-gray-600">{formatDate(order.order_date)}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    {order.status === 'new' && (
                      <button
                        onClick={() => handleAssignTechnician(order)}
                        className="flex-1 p-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors flex items-center justify-center"
                        title={t('assignTechnician')}
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(order)}
                      className="flex-1 p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center justify-center"
                      title={tCommon('edit')}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="flex-1 p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center justify-center"
                      title={tCommon('delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-gray-600">
        {t('showing', { shown: orders.length, total: orders.length })}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalCount={pagination.totalCount}
        buildHref={(page) => `?page=${page}`}
      />

      {/* Modals */}
      <OrderFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        order={selectedOrder}
        clientId={selectedClient || undefined}
        locationId={selectedLocation || undefined}
      />
      <AssignTechnicianModal
        isOpen={isAssignModalOpen}
        onClose={handleCloseAssignModal}
        order={orderToAssign}
      />
    </div>
  );
}
