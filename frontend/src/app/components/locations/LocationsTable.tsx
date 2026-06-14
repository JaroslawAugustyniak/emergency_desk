'use client';

import { useState } from 'react';
import { Edit, Trash2, ArrowUpDown, Plus, Loader } from 'lucide-react';
import Link from 'next/link';
import LocationFormModal from '@/app/components/locations/LocationFormModal';
import Pagination from '@/app/components/ui/Pagination';
import { deleteLocation } from '@/lib/actions/locations';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTableSearch } from '@/hooks/useTableSearch';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';

import BackButton  from '@/app/components/ui/BackButton';

type Location = {
  id: number;
  name: string;
  address: string;
  number: string;
  zip: string;
  city: string;
  country: string;
  client_id: number;
  created_at: string;
  updated_at: string;
};

type Pagination = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
};

type SortField = 'name' | 'address' | 'city' | 'created_at';

export default function LocationsTable({
  locations,
  pagination,
  clientId,
  sortBy = 'name',
  sortOrder = 'asc',
}: {
  locations: Location[];
  pagination: Pagination;
  clientId?: number;
  sortBy?: string;
  sortOrder?: string;
}) {
  const router = useRouter();
  const t = useTranslations('locations');
  const tCommon = useTranslations('common');
  const { searchTerm, isLoadingSearch, buildUrl, handleSearchChange } = useTableSearch();
  const { handleDelete } = useDeleteHandler({
    resourceKey: 'locations',
    deleteFunction: deleteLocation,
    onSuccess: () => router.refresh(),
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const handleSort = (field: SortField) => {
    const params = new URLSearchParams(window.location.search);
    const newSortOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    params.set('sort_by', field);
    params.set('sort_order', newSortOrder);
    router.push(`?${params.toString()}`);
  };

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedLocation(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLocation(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  return (
    <div className="w-full">
      {/* Search bar and Add button */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full max-w-sm">
          {clientId && (
                  <BackButton />
          )}
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
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('address')}
              >
                <div className="flex items-center gap-2">
                  {t('addressColumn')}
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('city')}
              >
                <div className="flex items-center gap-2">
                  {t('cityColumn')}
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('zipColumn')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tCommon('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {locations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  {t('noLocations')}
                </td>
              </tr>
            ) : (
              locations.map((location) => (
                <tr key={location.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {location.client_id ? `c${location.client_id}/` : ''}p{location.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <Link
                      href={`/dashboard/locations/${location.id}`}
                      className="hover:text-blue-600"
                    >
                      {location.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {location.address} {location.number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {location.city}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {location.zip}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <div className="relative group">
                        <button
                          onClick={() => handleEdit(location)}
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
                          onClick={() => handleDelete(location.id)}
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
        {locations.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            {t('noLocations')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {locations.map((location) => (
              <div
                key={location.id}
                className="bg-white border border-gray-200 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
              >
                <Link
                  href={`/dashboard/locations/${location.id}`}
                  className="flex items-start mb-3 group"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {location.name}
                  </h3>
                </Link>

                <div className="mb-3 pb-3 border-b border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">{t('addressColumn')}</p>
                  <p className="text-sm text-gray-600">{location.address} {location.number}</p>
                </div>

                <div className="mb-3 pb-3 border-b border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">{t('cityColumn')}</p>
                  <p className="text-sm text-gray-600">{location.city}, {location.zip}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(location)}
                      className="flex-1 p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center justify-center"
                      title={tCommon('edit')}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(location.id)}
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
        {t('showing', { shown: locations.length, total: locations.length })}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalCount={pagination.totalCount}
        buildHref={(page) => `?page=${page}`}
      />

      {/* Modal */}
      <LocationFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        location={selectedLocation}
        presetClientId={clientId}
      />
    </div>
  );
}
