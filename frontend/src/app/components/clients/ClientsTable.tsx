'use client';

import { useState, useMemo } from 'react';
import { Edit, Trash2, ArrowUpDown, Plus, Users, Mail } from 'lucide-react';
import Link from 'next/link';
import ClientFormModal from '@/app/components/clients/ClientFormModal';
import Pagination from '@/app/components/ui/Pagination';
import { deleteClient } from '@/lib/actions/clients';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTableSearch } from '@/hooks/useTableSearch';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';

type Client = {
  id: number;
  name: string;
  hash: string;
  created_at: string;
  updated_at: string;
};

type Pagination = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
};

type SortField = 'name' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function ClientsTable({
  clients,
  pagination
}: {
  clients: Client[];
  pagination: Pagination;
}) {
  const router = useRouter();
  const t = useTranslations('clients');
  const tCommon = useTranslations('common');
  const { searchTerm, buildUrl, handleSearchChange } = useTableSearch();
  const { handleDelete } = useDeleteHandler({
    resourceKey: 'clients',
    deleteFunction: deleteClient,
    onSuccess: () => router.refresh(),
  });
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const filteredAndSortedClients = useMemo(() => {
    let result = [...clients];

    result.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

    return result;
  }, [clients, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  const handleAddUser = (clientId: number) => {
    router.push(`/dashboard/users?role=client&clientId=${clientId}`);
  };

  const handleSendInvite = (clientId: number) => {
    router.push(`/dashboard/users?clientId=${clientId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  return (
    <div className="w-full">
      {/* Search bar and Add button */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <input
          type="text"
          placeholder={t('search')}
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full max-w-sm px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
        />

        <div className="flex flex-wrap items-center gap-3">
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tCommon('idColumn')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  {t('nameColumn')}
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('hashColumn')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center gap-2">
                  {t('createdColumn')}
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tCommon('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedClients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  {t('noClients')}
                </td>
              </tr>
            ) : (
              filteredAndSortedClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    c{client.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="hover:text-blue-600"
                    >
                      {client.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 truncate" title={client.hash}>
                    {client.hash}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(client.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <div className="relative group">
                        <button
                          onClick={() => handleEdit(client)}
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
                          onClick={() => handleAddUser(client.id)}
                          className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                          title={t('addUser')}
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <span className="tooltip tooltip-top-right">
                          {t('addUser')}
                        </span>
                      </div>
                      <div className="relative group">
                        <button
                          onClick={() => handleSendInvite(client.id)}
                          className="p-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                          title={t('sendInvite')}
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <span className="tooltip tooltip-top-right">
                          {t('sendInvite')}
                        </span>
                      </div>
                      <div className="relative group">
                        <button
                          onClick={() => handleDelete(client.id)}
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
        {filteredAndSortedClients.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            {t('noClients')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredAndSortedClients.map((client) => (
              <div
                key={client.id}
                className="bg-white border border-gray-200 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
              >
                <Link
                  href={`/dashboard/clients/${client.id}`}
                  className="flex items-start mb-3 group"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    c{client.id} - {client.name}
                  </h3>
                </Link>

                <div className="mb-3 pb-3 border-b border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">{t('hashColumn')}</p>
                  <p className="text-xs text-gray-600 truncate">{client.hash}</p>
                </div>

                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">{t('createdColumn')}</p>
                  <p className="text-sm text-gray-600">{formatDate(client.created_at)}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(client)}
                      className="flex-1 p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center justify-center"
                      title={tCommon('edit')}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAddUser(client.id)}
                      className="flex-1 p-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors flex items-center justify-center"
                      title={t('addUser')}
                    >
                      <Users className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSendInvite(client.id)}
                      className="flex-1 p-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors flex items-center justify-center"
                      title={t('sendInvite')}
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
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
        {t('showing', { shown: filteredAndSortedClients.length, total: clients.length })}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalCount={pagination.totalCount}
        buildHref={(page) => `?page=${page}`}
      />

      {/* Modal */}
      <ClientFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        client={selectedClient}
      />
    </div>
  );
}
