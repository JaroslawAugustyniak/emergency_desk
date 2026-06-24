'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import { getServiceCategories, deleteServiceCategory } from '@/lib/actions/serviceCategories';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import ServiceCategoryFormModal from './ServiceCategoryFormModal';
import { ServiceCategory } from '@/lib/types/serviceCategories';

type ServiceCategoriesSectionProps = {
  clientId: number;
};

export default function ServiceCategoriesSection({ clientId }: ServiceCategoriesSectionProps) {
  const { token } = useSessionContext();
  const router = useRouter();
  const t = useTranslations('serviceCategories');
  const tCommon = useTranslations('common');

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);

  useEffect(() => {
    if (token) {
      fetchCategories();
    }
  }, [token]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await getServiceCategories(clientId, token!);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching service categories:', error);
      await Swal.fire({
        title: tCommon('error'),
        text: t('fetchError'),
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (category: ServiceCategory) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (category: ServiceCategory) => {
    const result = await Swal.fire({
      title: tCommon('confirmDelete'),
      text: `${t('deleteConfirm')} "${category.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: tCommon('delete'),
      cancelButtonText: tCommon('cancel'),
    });

    if (result.isConfirmed) {
      try {
        await deleteServiceCategory(category.id, token!);
        await Swal.fire({
          title: t('deleted'),
          text: t('deletedMessage'),
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          position: 'top-end',
          toast: true,
        });
        await fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        await Swal.fire({
          title: tCommon('error'),
          text: error instanceof Error ? error.message : t('deleteError'),
          icon: 'error',
          confirmButtonColor: '#3b82f6',
        });
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
    fetchCategories();
  };

  const handleAddNew = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold">{t('title')}</h3>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('addNew')}
        </button>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-gray-500">{tCommon('loading')}</div>
      ) : categories.length === 0 ? (
        <div className="p-6 text-center text-gray-500">{t('noCategories')}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  {t('colorColumn')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  {t('nameColumn')}
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                  {tCommon('actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: category.color }}
                      title={category.color}
                    />
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900">{category.name}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title={tCommon('edit')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title={tCommon('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ServiceCategoryFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        clientId={clientId}
        category={selectedCategory}
      />
    </div>
  );
}
