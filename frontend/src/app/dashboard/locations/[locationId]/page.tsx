'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { deleteLocation } from '@/lib/actions/locations';
import Swal from 'sweetalert2';

import BackButton  from '@/app/components/ui/BackButton';
import LocationFormModal from '@/app/components/locations/LocationFormModal';

type Location = {
  id: number;
  name: string;
  address: string;
  number: string;
  zip: string;
  city: string;
  country: string;
  nip: string;
  client_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
};

export default function LocationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locationId = Array.isArray(params.locationId) ? params.locationId[0] : params.locationId;

  const t = useTranslations('locations');
  const tCommon = useTranslations('common');
  const { token, isLoading } = useSessionContext();

  const [location, setLocation] = useState<Location | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!token || isLoading) return;

    const fetchLocation = async () => {
      try {
        setIsLoadingData(true);
        const res = await fetch(`/api/locations/${locationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch location');
        }

        const data = await res.json();
        setLocation(data.data);
      } catch (error) {
        console.error('Error fetching location:', error);
        router.push('/dashboard/locations');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchLocation();
  }, [token, isLoading, locationId, router]);

  const handleDelete = async () => {
    if (!token || !location) return;

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
      await deleteLocation(location.id, token);
      await Swal.fire({
        title: t('deleted'),
        text: t('deletedMessage'),
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
      });
      router.push('/dashboard/locations');
    } catch (error) {
      console.error('Error deleting location:', error);
      await Swal.fire({
        title: tCommon('error'),
        text: t('deletedError'),
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
      <div className="px-2">
        <BackButton />
        <div className="text-center py-8">Ładowanie...</div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="px-2">
        <BackButton />
        <div className="text-center py-8 text-gray-500">{t('locationNotFound')}</div>
      </div>
    );
  }

  return (
    <div className="px-2">
      <BackButton />
      <div className="bg-white mt-2 rounded-lg shadow-md p-6 max-w-2xl">
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-3xl font-bold">
            {location.name}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              title={tCommon('edit')}
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              title={tCommon('delete')}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Address Section */}
          <div>
            <h2 className="text-lg font-semibold mb-3">{t('addressColumn')}</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900 font-medium">
                {location.address} {location.number}
              </p>
              <p className="text-gray-600">
                {location.zip} {location.city}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {location.country.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-500 mb-1">{t('createdColumn')}</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(location.created_at)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">{tCommon('updated')}</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(location.updated_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <LocationFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        location={location}
      />
    </div>
  );
}
