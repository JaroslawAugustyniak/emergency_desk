'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import { createLocation, updateLocation } from '@/lib/actions/locations';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

type Location = {
  id: number;
  name: string;
  address: string;
  number: string;
  zip: string;
  city: string;
  country: string;
  nip?: string;
  client_id: number;
  user_id?: number | null;
  created_at?: string;
  updated_at?: string;
};

type LocationFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  location?: Location | null;
  presetClientId?: number;
};

const COUNTRIES = [
  { code: 'pl', label: 'Polska' },
  { code: 'de', label: 'Niemcy' },
  { code: 'fr', label: 'Francja' },
  { code: 'gb', label: 'Wielka Brytania' },
  { code: 'it', label: 'Włochy' },
  { code: 'es', label: 'Hiszpania' },
  { code: 'cz', label: 'Czechy' },
  { code: 'sk', label: 'Słowacja' },
  { code: 'ua', label: 'Ukraina' },
];

export default function LocationFormModal({
  isOpen,
  onClose,
  location,
  presetClientId,
}: LocationFormModalProps) {
  const { token } = useSessionContext();
  const router = useRouter();
  const t = useTranslations('locations');
  const tCommon = useTranslations('common');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: number; first_name: string; last_name: string }[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    number: '',
    zip: '',
    city: '',
    country: 'pl',
    nip: '',
    client_id: presetClientId || 0,
    user_id: null as number | null,
  });

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        address: location.address,
        number: location.number,
        zip: location.zip,
        city: location.city,
        country: location.country,
        nip: location.nip || '',
        client_id: location.client_id,
        user_id: location.user_id || null,
      });
    } else {
      setFormData({
        name: '',
        address: '',
        number: '',
        zip: '',
        city: '',
        country: 'pl',
        nip:'',
        client_id: presetClientId || 0,
        user_id: null,
      });
    }
  }, [location, presetClientId, isOpen]);

  useEffect(() => {
    if (isOpen && token) {
      if (!presetClientId) {
        const fetchClients = async () => {
          try {
            const res = await fetch('/api/clients?per_page=100', {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            if (res.ok) {
              const data = await res.json();
              setClients(data.data || []);
            }
          } catch (error) {
            console.error('Error fetching clients:', error);
          }
        };
        fetchClients();
      }
    }
  }, [isOpen, presetClientId, token]);

  useEffect(() => {
    const clientIdToFetch = formData.client_id || presetClientId;
    if (isOpen && clientIdToFetch && token) {
      const fetchUsers = async () => {
        try {
          const res = await fetch(`/api/users?client_id=${clientIdToFetch}&per_page=100`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setUsers(data.data || []);
          }
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      };
      fetchUsers();
    }
  }, [isOpen, formData.client_id, presetClientId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!formData.client_id) {
      await Swal.fire({
        title: tCommon('error'),
        text: t('clientRequired'),
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (location) {
        await updateLocation(location.id, {
          name: formData.name,
          address: formData.address,
          number: formData.number,
          zip: formData.zip,
          city: formData.city,
          country: formData.country,
          nip: formData.nip,
          user_id: formData.user_id || undefined,
        }, token);
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
        const submitData = {
          ...formData,
          client_id: Number(formData.client_id),
        };


        await createLocation(submitData, token);
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
            {location ? t('edit') : t('addNew')}
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
              placeholder={t('enterLocationName')}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>
<div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('addressColumn')} *
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder={t('enterAddress')}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('numberColumn')} *
            </label>
            <input
              type="text"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              placeholder={t('enterNumber')}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div></div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('zipColumn')} *
              </label>
              <input
                type="text"
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                placeholder={t('enterZip')}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('cityColumn')} *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder={t('enterCity')}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('countryColumn')} *
            </label>
            <select
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NIP
            </label>
            <input
              type="text"
              value={formData.nip}
              onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
              placeholder="NIP"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {!presetClientId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('clientColumn')} *
              </label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: Number(e.target.value), user_id: null })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                required
              >
                <option value="">-- {tCommon('selectOption')} --</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(formData.client_id || presetClientId) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('userColumn') || 'Użytkownik'}
              </label>
              <select
                value={formData.user_id || ''}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">-- {tCommon('selectOption')} --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
