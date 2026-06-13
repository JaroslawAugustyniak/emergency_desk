'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Trash2 } from 'lucide-react';
import { deleteUser } from '@/lib/actions/users';
import { useTranslations } from 'next-intl';
import UserFormModal from '@/app/components/users/UserFormModal';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';

interface UserDetailActionsProps {
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    phone?: string;
    client_id?: number | null;
  };
}

export default function UserDetailActions({ user }: UserDetailActionsProps) {
  const router = useRouter();
  const tCommon = useTranslations('common');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { handleDelete } = useDeleteHandler({
    resourceKey: 'users',
    deleteFunction: deleteUser,
    onSuccess: () => router.push('/dashboard/users'),
  });

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
            onClick={() => handleDelete(user.id)}
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
