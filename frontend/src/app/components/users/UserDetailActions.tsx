'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Trash2 } from 'lucide-react';
import { deleteUser } from '@/lib/actions/users';
import { useTranslations } from 'next-intl';
import Swal from 'sweetalert2';
import UserFormModal from '@/app/components/users/UserFormModal';
import { useSessionContext } from '@/app/components/providers/SessionProvider';

interface UserDetailActionsProps {
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    phone?: string;
  };
}

export default function UserDetailActions({ user }: UserDetailActionsProps) {
  const router = useRouter();
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const { token } = useSessionContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDeleteClick = async (id: number) => {
    if (!token) {
      alert('Not authenticated');
      return;
    }

    try {
      await deleteUser(id, token);
      router.push('/dashboard/users');

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
        text: t('deletedError'),
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <div className="relative group">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            title={tCommon('edit')}
          >
            <Edit className="w-4 h-4" />
            <span className="text-xs">{tCommon('edit')}</span>
          </button>
        </div>

        <div className="relative group">
          <button
            onClick={() => handleDeleteClick(user.id)}
            className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            title={tCommon('delete')}
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-xs">{tCommon('delete')}</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <UserFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={user} />
    </>
  );
}
