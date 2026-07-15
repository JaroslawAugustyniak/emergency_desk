'use client';

import { useState, useEffect } from 'react';
import Modal from '@/app/components/ui/Modal';
import { assignTechnician } from '@/lib/actions/orders';
import { getTechnicians, type Technician } from '@/lib/actions/technicians';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import type { Order } from '@/lib/types/orders';

type AssignTechnicianModalProps = {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
};

export default function AssignTechnicianModal({
  isOpen,
  onClose,
  order,
}: AssignTechnicianModalProps) {
  const router = useRouter();
  const { token } = useSessionContext();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = useTranslations('orders');
  const tCommon = useTranslations('common');

  // Fetch technicians on mount
  useEffect(() => {
    if (!isOpen || !token) return;

    const fetchTechnicians = async () => {
      try {
        setIsLoadingTechnicians(true);
        const data = await getTechnicians(token);
        setTechnicians(data.data || []);
      } catch (error) {
        console.error('Error fetching technicians:', error);
        setError(error instanceof Error ? error.message : t('loadingError'));
      } finally {
        setIsLoadingTechnicians(false);
      }
    };

    fetchTechnicians();
  }, [isOpen, token, t]);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && order) {
      setSelectedTechnicianId(String(order.technician_id || ''));
      setIsEmergency(order.is_emergency || false);
      setError(null);
    }
  }, [isOpen, order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!token || !order) {
      setError('Not authenticated');
      setIsSubmitting(false);
      return;
    }

    if (!selectedTechnicianId) {
      setError(t('validateError') || 'Please select a technician');
      setIsSubmitting(false);
      return;
    }

    try {
      await assignTechnician(
        order.id,
        {
          technician_id: Number(selectedTechnicianId),
          is_emergency: isEmergency,
        },
        token
      );

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('savingError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('assignTechnician')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Technician Select */}
        <div>
          <label
            htmlFor="technician_id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t('assignTechnician')} *
          </label>
          <select
            id="technician_id"
            value={selectedTechnicianId}
            onChange={(e) => setSelectedTechnicianId(e.target.value)}
            required
            disabled={isLoadingTechnicians}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">{tCommon('selectOption')}</option>
            {isLoadingTechnicians ? (
              <option disabled>Ładowanie...</option>
            ) : technicians.length === 0 ? (
              <option disabled>Brak dostępnych techników</option>
            ) : (
              technicians.map((technician) => (
                <option key={technician.id} value={technician.id}>
                  {technician.first_name} {technician.last_name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Emergency Checkbox */}
        <div className="flex items-center">
          <input
            id="is_emergency"
            type="checkbox"
            checked={isEmergency}
            onChange={(e) => setIsEmergency(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <label
            htmlFor="is_emergency"
            className="ml-2 text-sm font-medium text-gray-700"
          >
            {t('emergency')}
          </label>
        </div>

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
            {tCommon('cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !selectedTechnicianId}
            className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? tCommon('saving') : tCommon('save')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
