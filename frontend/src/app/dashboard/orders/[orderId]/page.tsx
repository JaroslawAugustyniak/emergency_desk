'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import { Edit, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';
import { getOrder, deleteOrder, changeOrderStatus } from '@/lib/actions/orders';
import BackButton from '@/app/components/ui/BackButton';
import OrderFormModal from '@/app/components/orders/OrderFormModal';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import Swal from 'sweetalert2';
import type { Order } from '@/lib/types/orders';


const statusColors: Record<string, string> = {
  new: 'bg-gray-100 text-gray-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  paused: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  invoiced: 'bg-purple-100 text-purple-800',
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;

  const t = useTranslations('orders');
  const tCommon = useTranslations('common');
  const { token, isLoading } = useSessionContext();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { handleDelete } = useDeleteHandler({
    resourceKey: 'orders',
    deleteFunction: deleteOrder,
    onSuccess: () => router.push('/dashboard/orders'),
  });

  useEffect(() => {
    if (!token || isLoading) return;

    const fetchOrder = async () => {
      try {
        setIsLoadingData(true);
        const data = await getOrder(Number(orderId), token);
        setOrder(data.data);
      } catch (error) {
        console.error('Error fetching order:', error);
        router.push('/dashboard/orders');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchOrder();
  }, [token, isLoading, orderId, router]);

  const handleEdit = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!token || !order) return;

    const result = await Swal.fire({
      title: t('changeStatusConfirm'),
      text: t('changeStatusMessage'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: tCommon('confirm'),
      cancelButtonText: tCommon('cancel'),
    });

    if (!result.isConfirmed) return;

    try {
      const updatedOrder = await changeOrderStatus(
        order.id,
        { status: newStatus as 'new' | 'assigned' | 'in_progress' | 'paused' | 'completed' | 'invoiced' },
        token
      );
      setOrder(updatedOrder);

      await Swal.fire({
        title: t('statusChanged'),
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
      });
    } catch (error) {
      console.error('Error changing status:', error);
      await Swal.fire({
        title: 'Error',
        text: error instanceof Error ? error.message : t('statusChangeError'),
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

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      new: t('statusNew'),
      assigned: t('statusAssigned'),
      in_progress: t('statusInProgress'),
      paused: t('statusPaused'),
      completed: t('statusCompleted'),
      invoiced: t('statusInvoiced'),
    };
    return labels[status] || status;
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="px-2 -mt-18">
        <BackButton />
        <div className="text-center py-8">Ładowanie...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="px-2">
        <BackButton />
        <div className="text-center py-8 text-gray-500">{t('orderNotFound')}</div>
      </div>
    );
  }

  return (
    <div className="px-2">
      <BackButton />

      <div className="mt-2 bg-white rounded-lg shadow-md p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">
            {order.client_id ? `c${order.client_id}/` : ''}
            {order.location_id ? `p${order.location_id}/` : ''}o{order.id}
          </h1>
          <div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
              {getStatusLabel(order.status)}
              {order.is_emergency && <span className="ml-2">🚨</span>}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Client and Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">{t('client')}</h3>
              <Link href={`/dashboard/clients/${order.client_id}`} className="text-blue-600 hover:underline font-medium">
                {order.client?.name || '-'}
              </Link>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">{t('location')}</h3>
              <p className="text-gray-900">
                {order.location?.street_no}
                {order.location?.street_no && ` / ${order.location.apartment_no}`}
                {order.location?.city && `, ${order.location.city}`}
              </p>
            </div>
          </div>

          {/* Service Category */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-2">{t('serviceCategory')}</h3>
            {order.service_category && (
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: order.service_category.color }}
                ></div>
                <span className="text-gray-900">{order.service_category.name}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {order.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">{t('description')}</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{order.description}</p>
            </div>
          )}

          {/* Order Dates */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-500 mb-1">{t('orderDate')}</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(order.created_at)}
              </p>
            </div>
            {order.start_at && (
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('startAt')}</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(order.start_at)}
                </p>
              </div>
            )}
          </div>

          {/* Financial Info */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-500 mb-1">{t('vatRate')}</p>
              <p className="text-sm font-medium text-gray-900">{order.vat_rate}%</p>
            </div>
            {order.price_total && (
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('priceTotal')}</p>
                <p className="text-sm font-medium text-gray-900">{order.price_total.toFixed(2)} PLN</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-gray-200 flex flex-wrap gap-2">
            <button
              onClick={handleEdit}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              title={tCommon('edit')}
            >
              <Edit className="w-5 h-5" />
              {tCommon('edit')}
            </button>
            <button
              onClick={() => handleDelete(order.id)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              title={tCommon('delete')}
            >
              <Trash2 className="w-5 h-5" />
              {tCommon('delete')}
            </button>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              title={t('generatePDF')}
            >
              <FileText className="w-5 h-5" />
              {t('generatePDF')}
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <OrderFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        order={order}
      />
    </div>
  );
}
