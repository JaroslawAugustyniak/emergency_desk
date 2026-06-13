'use client';

import { useState, useEffect } from 'react';
import Modal from '@/app/components/ui/Modal';
import { createClient, updateClient, regenerateClientHash } from '@/lib/actions/clients';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSessionContext } from '@/app/components/providers/SessionProvider';

type Client = {
  id: number;
  name: string;
  hash: string;
  created_at: string;
  updated_at: string;
};

type ClientFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  client?: Client | null;
  onSuccess?: () => void;
};

export default function ClientFormModal({
  isOpen,
  onClose,
  client = null,
  onSuccess,
}: ClientFormModalProps) {
  const router = useRouter();
  const { token } = useSessionContext();
  const [formData, setFormData] = useState({
    name: '',
  });
  const [regenerateHash, setRegenerateHash] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = useTranslations('clients');
  const c = useTranslations('common');

  const isEditMode = !!client;

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
      });
      setRegenerateHash(false);
    } else {
      setFormData({
        name: '',
      });
    }
    setError(null);
  }, [client, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!token) {
      setError('Not authenticated');
      setIsSubmitting(false);
      return;
    }

    try {
      if (isEditMode && client) {
        await updateClient(
          client.id,
          {
            name: formData.name,
          },
          token
        );

        if (regenerateHash) {
          await regenerateClientHash(client.id, token);
        }
      } else {
        await createClient(
          {
            name: formData.name,
          },
          token
        );
      }

      router.refresh();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('savingError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t('edit') : t('addNew')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t('nameColumn')}
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('enterClientName')}
          />
        </div>

        {isEditMode && client && (
          <>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">{t('hashLabel')}</p>
              <div className="p-2 bg-white border border-gray-200 rounded text-xs font-mono text-gray-600 break-all">
                {client.hash}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="regenerateHash"
                checked={regenerateHash}
                onChange={(e) => setRegenerateHash(e.target.checked)}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label
                htmlFor="regenerateHash"
                className="text-sm text-gray-700 cursor-pointer"
              >
                {t('regenerateHashCheckbox')}
              </label>
            </div>
          </>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm whitespace-pre-wrap">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {c('cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? c('saving') : isEditMode ? c('save') : t('addClient')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
