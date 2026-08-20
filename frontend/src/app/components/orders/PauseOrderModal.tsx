'use client';

import { useState, useEffect } from 'react';
import Modal from '@/app/components/ui/Modal';
import { pauseOrder } from '@/lib/actions/orders';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import type { Order } from '@/lib/types/orders';

type PauseOrderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
};

export default function PauseOrderModal({
  isOpen,
  onClose,
  order,
}: PauseOrderModalProps) {
  const router = useRouter();
  const { token } = useSessionContext();
  const [stopReason, setStopReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = useTranslations('orders');
  const tCommon = useTranslations('common');

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStopReason(order?.stop_reason || '');
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

    if (!stopReason.trim()) {
      setError(t('validateError') || 'Powód wstrzymania jest wymagany');
      setIsSubmitting(false);
      return;
    }

    try {
      await pauseOrder(order.id, stopReason, token);
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
      title={t('pauseOrder')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Stop Reason Textarea */}
        <div>
          <label
            htmlFor="stop_reason"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t('stopReason')} *
          </label>
          <textarea
            id="stop_reason"
            value={stopReason}
            onChange={(e) => setStopReason(e.target.value)}
            placeholder={t('stopReasonPlaceholder') || 'Wpisz powód wstrzymania zlecenia...'}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {stopReason.length} / 500 {t('characters') || 'znaków'}
          </p>
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
            disabled={isSubmitting || !stopReason.trim()}
            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? tCommon('saving') : t('pauseOrder')}
          </button>
        </div>
      </form>
    </Modal>
  );
}