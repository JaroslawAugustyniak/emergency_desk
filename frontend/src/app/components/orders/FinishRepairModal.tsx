'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { changeOrderStatus } from '@/lib/actions/orders';
import type { Order } from '@/lib/types/orders';
import Swal from 'sweetalert2';

interface FinishRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  token: string;
  onSuccess?: () => void;
}

export default function FinishRepairModal({
  isOpen,
  onClose,
  order,
  token,
  onSuccess,
}: FinishRepairModalProps) {
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');
  const [priceTotal, setPriceTotal] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPriceTotal(order.price_total ? String(order.price_total) : '');
    }
  }, [isOpen, order.id]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const price = priceTotal && priceTotal.trim() ? parseFloat(priceTotal) : null;

      // Determine status based on price: if price > 0 => completed, else => finished
      const status = price && price > 0 ? 'completed' : 'finished';

      await changeOrderStatus(
        order.id,
        {
          status: status as 'finished' | 'completed',
          price_total: price,
        },
        token
      );

      setPriceTotal('');
      onClose();

      await Swal.fire({
        title: t('repairFinished'),
        text: status === 'completed' ? t('repairCompletedWithPrice') : t('repairFinishedWithoutPrice'),
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error finishing repair:', error);
      await Swal.fire({
        title: 'Error',
        text: error instanceof Error ? error.message : t('statusChangeError'),
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPriceTotal('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('finishRepair')}
        </h2>

        <p className="text-sm text-gray-600 mb-6">
          {t('finishRepairPriceDescription', {
            completedStatus: t('statusCompleted'),
            finishedStatus: t('statusFinished'),
          })}
        </p>

        <div className="mb-6">
          <label htmlFor="priceTotal" className="block text-sm font-medium text-gray-700 mb-2">
            {t('priceTotal')}
            <span className="text-gray-400 ml-1">({t('optional')})</span>
          </label>
          <input
            id="priceTotal"
            type="number"
            min="0"
            step="0.01"
            value={priceTotal}
            onChange={(e) => setPriceTotal(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            {priceTotal && parseFloat(priceTotal) > 0
              ? t('statusWillBeCompleted', { status: t('statusCompleted') })
              : t('statusWillBeFinished', { status: t('statusFinished') })}
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {tCommon('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? tCommon('saving') : t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}