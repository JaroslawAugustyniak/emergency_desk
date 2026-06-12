'use client';

import { useState, useMemo } from 'react';
import { Edit, Trash2, ArrowUpDown, Plus } from 'lucide-react';
import Link from 'next/link';
import UserFormModal from '@/app/components/users/UserFormModal';
import Pagination from '@/app/components/ui/Pagination';
import { deleteUser } from '@/lib/actions/users';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { useTranslations } from 'next-intl';
import { useTableSearch } from '@/hooks/useTableSearch';
import { useSessionContext } from '@/app/components/providers/SessionProvider';

type User = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
};

type Pagination = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
};

type SortField = 'first_name' | 'email';
type SortDirection = 'asc' | 'desc';

export default function UsersTable({
  users,
  pagination
}: {
  users: User[];
  pagination: Pagination;
}) {
  const router = useRouter();
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const { token } = useSessionContext();
  const { searchTerm, buildUrl, handleSearchChange } = useTableSearch();
  const [sortField, setSortField] = useState<SortField>('first_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

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
  }, [users, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteClick = async (id: number) => {
    if (!token) {
      alert('Not authenticated');
      return;
    }

    const result = await Swal.fire({
      title: t('deleteConfirm'),
      text: t('deleteMessage'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t('deleteButton'),
      cancelButtonText: tCommon('cancel'),
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteUser(id, token);
      router.refresh();

      await Swal.fire({
        title: t('deleted'),
        text: t('deletedMessage'),
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      await Swal.fire({
        title: 'Error',
        text: error instanceof Error ? error.message : t('deletedError'),
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
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
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('first_name')}
              >
                <div className="flex items-center gap-2">
                  {t('nameColumn')}
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center gap-2">
                  {t('emailColumn')}
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('roleColumn')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tCommon('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  {t('noUsers')}
                </td>
              </tr>
            ) : (
              filteredAndSortedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <Link
                      href={`/dashboard/users/${user.id}`}
                      className="hover:text-blue-600"
                    >
                      {user.first_name} {user.last_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <div className="relative group">
                        <button
                          onClick={() => handleEdit(user)}
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
                          onClick={() => handleDeleteClick(user.id)}
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
        {filteredAndSortedUsers.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            {t('noUsers')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredAndSortedUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white border border-gray-200 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
              >
                <Link
                  href={`/dashboard/users/${user.id}`}
                  className="flex items-start mb-3 group"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {user.first_name} {user.last_name}
                  </h3>
                </Link>

                <div className="mb-3 pb-3 border-b border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">{t('emailColumn')}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>

                <div className="mb-3 pb-3 border-b border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">{t('roleColumn')}</p>
                  <p className="text-sm text-gray-600 font-medium">{user.role}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="flex-1 p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center justify-center"
                      title={tCommon('edit')}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(user.id)}
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
        {t('showing', { shown: filteredAndSortedUsers.length, total: users.length })}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalCount={pagination.totalCount}
        buildHref={(page) => `?page=${page}`}
      />

      {/* Modal */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        user={selectedUser}
      />
    </div>
  );
}
