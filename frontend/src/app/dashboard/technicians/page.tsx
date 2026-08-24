'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import type { User } from '@/lib/types/users';

export default function TechniciansPage() {
  const router = useRouter();
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const tDash = useTranslations('dashboard');
  const { token, isLoading, role } = useSessionContext();

  const [technicians, setTechnicians] = useState<User[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Redirect if not tech_manager
  useEffect(() => {
    if (!isLoading && role !== 'tech_manager') {
      router.push('/dashboard');
    }
  }, [role, isLoading, router]);

  useEffect(() => {
    if (!token || isLoading) return;

    const fetchTechnicians = async () => {
      try {
        setIsLoadingData(true);
        const response = await fetch(
          `/api/users?role=technician&page=${currentPage}&per_page=15`,
          {
            headers: { 'Authorization': `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch technicians');
        }

        const data = await response.json();
        setTechnicians(data.data);
        setTotalPages(data.pagination.last_page);
      } catch (error) {
        console.error('Error fetching technicians:', error);
        Swal.fire({
          title: 'Error',
          text: t('loadingError'),
          icon: 'error',
          confirmButtonColor: '#3b82f6',
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchTechnicians();
  }, [token, isLoading, currentPage, t]);

  const handleDelete = async (userId: number) => {
    const result = await Swal.fire({
      title: t('deleteConfirm'),
      text: t('deleteMessage'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t('deleteButton'),
      cancelButtonText: tCommon('cancel'),
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete technician');
      }

      setTechnicians(technicians.filter(u => u.id !== userId));

      await Swal.fire({
        title: t('deleted'),
        text: t('deletedMessage'),
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
      });
    } catch (error) {
      console.error('Error deleting technician:', error);
      await Swal.fire({
        title: 'Error',
        text: t('deletedError'),
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">{tCommon('loading')}</div>
      </div>
    );
  }

  if (role !== 'tech_manager') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tDash('technicians')}</h1>
            <p className="text-gray-600 mt-1">Zarządzaj technikamami</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Dodaj technika
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {isLoadingData ? (
            <div className="p-8 text-center text-gray-600">{tCommon('loading')}</div>
          ) : technicians.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              {t('noUsers')}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        {t('name')}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        {t('phone')}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {technicians.map((user) => (
                      <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {user.first_name} {user.last_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {user.phone || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm flex gap-2">
                          <Link
                            href={`/dashboard/technicians/${user.id}/edit`}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            {tCommon('edit')}
                          </Link>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            {tCommon('delete')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {tCommon('previous')}
                  </button>
                  <span className="text-sm text-gray-600">
                    Strona {currentPage} z {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {tCommon('next')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
