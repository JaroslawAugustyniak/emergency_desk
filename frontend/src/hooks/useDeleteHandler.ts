'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Swal from 'sweetalert2';
import { useSessionContext } from '@/app/components/providers/SessionProvider';

export function useDeleteHandler(options: {
  resourceKey: string; // translation key: 'users' | 'clients'
  deleteFunction: (id: number, token: string) => Promise<any>;
  onSuccess: () => Promise<void> | void;
}) {
  const router = useRouter();
  const t = useTranslations(options.resourceKey);
  const tCommon = useTranslations('common');
  const { token } = useSessionContext();

  const handleDelete = async (id: number) => {
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
      await options.deleteFunction(id, token);
      await options.onSuccess();

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
      console.error('Error deleting:', error);
      await Swal.fire({
        title: 'Error',
        text: error instanceof Error ? error.message : t('deletedError'),
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    }
  };

  return { handleDelete };
}
