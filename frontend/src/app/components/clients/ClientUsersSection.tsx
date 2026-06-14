'use client';

import { useFetchUsers } from '@/hooks/useFetchUsers';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Edit, Trash2 } from 'lucide-react';
import { deleteUser } from '@/lib/actions/users';
import { useRouter } from 'next/navigation';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';

type User = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  client_id?: number | null;
};

export default function ClientUsersSection({ clientId }: { clientId: number }) {
  const { token, isLoading } = useSessionContext();
  const router = useRouter();
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const { handleDelete } = useDeleteHandler({
    resourceKey: 'users',
    deleteFunction: deleteUser,
    onSuccess: () => router.refresh(),
  });

  const { users, isLoadingData } = useFetchUsers({
    token,
    isLoading,
    page: 1,
    search: '',
    limit: 100,
    clientId: String(clientId),
    role: 'client',
    sort_by: 'first_name',
    sort_order: 'asc',
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  if (isLoadingData) {
    return <div className="text-center py-8">Ładowanie...</div>;
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tCommon('idColumn')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('nameColumn')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('emailColumn')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tCommon('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  {t('noUsers')}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    c{clientId}/u{user.id}
                  </td>
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <div className="relative group">
                        <button
                          onClick={() => router.push(`/dashboard/users/${user.id}`)}
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
                          onClick={() => handleDelete(user.id)}
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

      {users.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          {t('showing', { shown: users.length, total: users.length })}
        </div>
      )}
    </div>
  );
}
