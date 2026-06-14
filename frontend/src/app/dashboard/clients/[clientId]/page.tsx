'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import { Copy, RotateCcw, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { regenerateClientHash } from '@/lib/actions/clients';
import BackButton  from '@/app/components/ui/BackButton'; 
import Swal from 'sweetalert2';

type Client = {
  id: number;
  name: string;
  hash: string;
  created_at: string;
  updated_at: string;
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = Array.isArray(params.clientId) ? params.clientId[0] : params.clientId;

  const t = useTranslations('clients');
  const tCommon = useTranslations('common');
  const { token, isLoading } = useSessionContext();

  const [client, setClient] = useState<Client | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    if (!token || isLoading) return;

    const fetchClient = async () => {
      try {
        setIsLoadingData(true);
        const res = await fetch(`/api/clients/${clientId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch client');
        }

        const data = await res.json();
        setClient(data.data);
      } catch (error) {
        console.error('Error fetching client:', error);
        router.push('/dashboard/clients');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchClient();
  }, [token, isLoading, clientId, router]);

  const handleCopyHash = async () => {
    if (client?.hash) {
      await navigator.clipboard.writeText(client.hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handleUsers = (clientId: number) => {
    router.push(`/dashboard/users?role=client&clientId=${clientId}`);
  };

  const handleRegenerateHash = async () => {
    if (!token || !client) return;

    const result = await Swal.fire({
      title: t('regenerateHashConfirm'),
      text: t('regenerateHashMessage'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t('regenerateButton'),
      cancelButtonText: tCommon('cancel'),
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const updatedClient = await regenerateClientHash(client.id, token);
      setClient(updatedClient);

      await Swal.fire({
        title: t('regenerated'),
        text: t('regeneratedMessage'),
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
    } catch (error) {
      console.error('Error regenerating hash:', error);
      await Swal.fire({
        title: 'Error',
        text: error instanceof Error ? error.message : t('regeneratedError'),
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="px-2 -mt-18">
       <BackButton />
        <div className="text-center py-8">Ładowanie...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="px-2">
        <BackButton />
        <div className="text-center py-8 text-gray-500">{t('clientNotFound')}</div>
      </div>
    );
  }

  return (
    <div className="px-2">
     <BackButton/>

      <div className="mt-2 bg-white rounded-lg shadow-md p-6 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">
          c{client.id} - {client.name}
        </h1>

        <div className="space-y-6">
          {/* Hash Section */}
          <div>
            <h2 className="text-lg font-semibold mb-3">{t('hashLabel')}</h2>
            <div className="flex gap-2 items-center">
              <div className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-600 break-all">
                {client.hash}
              </div>
              <button
                onClick={handleCopyHash}
                className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                title={tCommon('copy')}
              >
                <Copy className="w-5 h-5" />
              </button>
              <button
                onClick={handleRegenerateHash}
                className="p-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                title={t('regenerateHashCheckbox')}
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
            {copiedHash && (
              <p className="mt-2 text-sm text-green-600">{t('hashCopied')}</p>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-500 mb-1">{t('createdColumn')}</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(client.created_at)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">{tCommon('updated')}</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(client.updated_at)}
              </p>
            </div>
          </div>

          {/* Locations Button */}
          <div className="pt-6 border-t border-gray-200">
            <Link
              href={`/dashboard/locations?clientId=${clientId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            >
              <MapPin className="w-5 h-5" />
              {t('viewLocations')}
            </Link>
            <Link
              href={`/dashboard/users?role=client&clientId=${clientId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            >
              <Users className="w-5 h-5" />
              {t('viewUsers')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
