'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import { createServiceCategory, updateServiceCategory } from '@/lib/actions/serviceCategories';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { ServiceCategory, UpdateServiceCategoryData } from '@/lib/types/serviceCategories';

type ServiceCategoryFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  clientId: number;
  category?: ServiceCategory | null;
};

function generateRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export default function ServiceCategoryFormModal({
  isOpen,
  onClose,
  clientId,
  category,
}: ServiceCategoryFormModalProps) {
  const { token } = useSessionContext();
  const router = useRouter();
  const t = useTranslations('serviceCategories');
  const tCommon = useTranslations('common');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    color: generateRandomColor(),
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        color: category.color,
      });
    } else {
      setFormData({
        name: '',
        color: generateRandomColor(),
      });
    }
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!formData.name.trim()) {
      await Swal.fire({
        title: tCommon('error'),
        text: t('nameRequired'),
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (category) {
        const updateData: UpdateServiceCategoryData = {
          name: formData.name,
          color: formData.color,
        };
        await updateServiceCategory(category.id, updateData, token);
        await Swal.fire({
          title: t('updated'),
          text: t('updatedMessage'),
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          position: 'top-end',
          toast: true,
        });
      } else {
        await createServiceCategory(
          {
            client_id: clientId,
            name: formData.name,
            color: formData.color,
          },
          token
        );
        await Swal.fire({
          title: t('created'),
          text: t('createdMessage'),
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          position: 'top-end',
          toast: true,
        });
      }
      onClose();
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      await Swal.fire({
        title: tCommon('error'),
        text: error instanceof Error ? error.message : t('savingError'),
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {category ? t('edit') : t('addNew')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('nameColumn')} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('enterName')}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('colorColumn')} *
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#000000"
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              {tCommon('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-black text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? tCommon('saving') : tCommon('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
