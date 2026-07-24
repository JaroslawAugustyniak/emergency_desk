'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import { Edit, Trash2, FileText, UserPlus, FingerprintPattern, MapPin, Mountain, UserRound, BookCheck } from 'lucide-react';
import Link from 'next/link';
import { getOrder, deleteOrder, changeOrderStatus } from '@/lib/actions/orders';
import BackButton from '@/app/components/ui/BackButton';
import FormattedOrderNumber from '@/app/components/orders/FormattedOrderNumber';
import OrderFormModal from '@/app/components/orders/OrderFormModal';
import AssignTechnicianModal from '@/app/components/orders/AssignTechnicianModal';
import PhotoUploadSection from '@/app/components/orders/PhotoUploadSection';
import { useDeleteHandler } from '@/hooks/useDeleteHandler';
import Swal from 'sweetalert2';
import Lightbox from 'yet-another-react-lightbox';
import type { Order, Photo } from '@/lib/types/orders';


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
  const tL = useTranslations('locations');
  const tCommon = useTranslations('common');
  const { token, isLoading, role } = useSessionContext();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [workReport, setWorkReport] = useState('');
  const [isSavingWorkReport, setIsSavingWorkReport] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [materials, setMaterials] = useState<Array<{ id?: number; name: string; price: string }>>([
    { name: '', price: '' },
  ]);
  const [isSavingMaterials, setIsSavingMaterials] = useState(false);

  const isAdmin = (role == 'admin' ? true : false);
  const isClient = (role == 'client' ? true : false);
  const isTechnician = (role == 'technician' ? true : false);


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
        setWorkReport(data.data.work_report || '');
        setPhotos(data.data.photos || []);

        // Fetch materials
        try {
          console.log('Fetching materials for order:', orderId);
          const materialsResponse = await fetch(`/api/orders/${orderId}/materials`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          console.log('Materials response status:', materialsResponse.status);
          if (materialsResponse.ok) {
            const materialsData = await materialsResponse.json();
            console.log('Materials data:', materialsData);
            if (materialsData.data && materialsData.data.length > 0) {
              setMaterials(materialsData.data.map((m: any) => ({
                id: m.id,
                name: m.name,
                price: String(m.price),
              })));
            }
          } else {
            console.log('Materials response not ok:', materialsResponse.status);
          }
        } catch (error) {
          console.error('Error fetching materials:', error);
        }
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

  const handleAssignTechnician = () => {
    setIsAssignModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
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

  const handleStartRepair = async () => {
    if (!token || !order) return;

    const result = await Swal.fire({
      title: t('startRepairConfirm'),
      text: t('startRepairMessage'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: tCommon('confirm'),
      cancelButtonText: tCommon('cancel'),
    });

    if (!result.isConfirmed) return;

    try {
      const updatedOrder = await changeOrderStatus(
        order.id,
        { status: 'in_progress' },
        token
      );
      setOrder(updatedOrder);

      await Swal.fire({
        title: t('repairStarted'),
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
      });
    } catch (error) {
      console.error('Error starting repair:', error);
      await Swal.fire({
        title: 'Error',
        text: error instanceof Error ? error.message : t('statusChangeError'),
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    }
  };

  const handleFinishRepair = async () => {
    if (!token || !order) return;

    const result = await Swal.fire({
      title: t('finishRepairConfirm'),
      text: t('finishRepairMessage'),
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
        { status: 'completed' },
        token
      );
      setOrder(updatedOrder);

      await Swal.fire({
        title: t('repairFinished'),
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
      });
    } catch (error) {
      console.error('Error finishing repair:', error);
      await Swal.fire({
        title: 'Error',
        text: error instanceof Error ? error.message : t('statusChangeError'),
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    }
  };

  const handleResumeRepair = async () => {
    if (!token || !order) return;

    const result = await Swal.fire({
      title: t('resumeRepairConfirm'),
      text: t('resumeRepairMessage'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6b7280',
      confirmButtonText: tCommon('confirm'),
      cancelButtonText: tCommon('cancel'),
    });

    if (!result.isConfirmed) return;

    try {
      const updatedOrder = await changeOrderStatus(
        order.id,
        { status: 'in_progress' },
        token
      );
      setOrder(updatedOrder);

      await Swal.fire({
        title: t('repairResumed'),
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
      });
    } catch (error) {
      console.error('Error resuming repair:', error);
      await Swal.fire({
        title: 'Error',
        text: error instanceof Error ? error.message : t('statusChangeError'),
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    }
  };

  const handleSaveWorkReport = async () => {
    if (!token || !order) return;

    setIsSavingWorkReport(true);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ work_report: workReport }),
      });

      if (!response.ok) {
        throw new Error(t('workReportSaveError'));
      }

      const data = await response.json();
      setOrder(data.data);

      await Swal.fire({
        title: t('workReportSaved'),
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
      });
    } catch (error) {
      console.error('Error saving work report:', error);
      await Swal.fire({
        title: 'Error',
        text: error instanceof Error ? error.message : t('workReportSaveError'),
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setIsSavingWorkReport(false);
    }
  };

  const handlePhotoUpload = async (files: FileList) => {
    if (!token || !order) return;

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      await Swal.fire({
        title: 'Error',
        text: 'Please select image files',
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const imageCompression = await import('browser-image-compression');
      const formData = new FormData();

      for (const file of imageFiles) {
        const compressedFile = await imageCompression.default(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
        formData.append('photos[]', compressedFile);
      }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress(Math.round(percentComplete));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              setPhotos(data.data || []);
              resolve();
            } catch (error) {
              reject(new Error('Failed to parse response'));
            }
          } else {
            reject(new Error(t('photosUploadError')));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error(t('photosUploadError')));
        });

        xhr.open('POST', `/api/orders/${order.id}/photos`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      await Swal.fire({
        title: t('photosUploaded'),
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
      });
    } catch (error) {
      console.error('Upload error:', error);
      await Swal.fire({
        title: 'Error',
        text: error instanceof Error ? error.message : t('photosUploadError'),
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handlePhotoDelete = async (photoId: number) => {
    const result = await Swal.fire({
      title: t('deletePhoto'),
      text: tCommon('confirmDelete'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: tCommon('yes'),
      cancelButtonText: tCommon('no'),
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/orders/${order?.id}/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(t('photoDeleteError'));
      }

      setPhotos(photos.filter((p) => p.id !== photoId));

      await Swal.fire({
        title: t('photoDeletedSuccess'),
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
      });
    } catch (error) {
      console.error('Delete error:', error);
      await Swal.fire({
        title: 'Error',
        text: error instanceof Error ? error.message : t('photoDeleteError'),
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    }
  };

  const handleMaterialChange = (index: number, field: 'name' | 'price', value: string) => {
    const newMaterials = [...materials];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    setMaterials(newMaterials);
  };

  const handleAddMaterial = () => {
    setMaterials([...materials, { name: '', price: '' }]);
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const handleSaveMaterials = async () => {
    if (!token || !order) return;

    setIsSavingMaterials(true);
    console.log('Saving materials with token:', token.substring(0, 20) + '...');
    try {
      const response = await fetch(`/api/orders/${order.id}/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ materials }),
      });
      console.log('Materials save response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(t('materialsError'));
      }

      const data = await response.json();
      if (data.data) {
        setMaterials(data.data.map((m: any) => ({
          id: m.id,
          name: m.name,
          price: String(m.price),
        })));
      }

      await Swal.fire({
        title: t('materialsSaved'),
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
        toast: true,
      });
    } catch (error) {
      console.error('Error saving materials:', error);
      await Swal.fire({
        title: 'Error',
        text: error instanceof Error ? error.message : t('materialsError'),
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setIsSavingMaterials(false);
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

      <div className="flex items-center justify-between mt-1">
      <div className="flex items-center justify-end mb-6 gap-1">
        {/* Action Buttons */}

            {(order.status === 'new' || order.status === 'assigned') && isAdmin && (
              <button
                onClick={handleAssignTechnician}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                title={t('assignTechnician')}
              >
                <UserPlus className="w-5 h-5" />
                {t('assignTechnician')}
              </button>
            )}
            {order.status === 'new' && (
              <>
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
             </>
            )}

            {isTechnician && order.status === 'assigned' && (
              <button
                onClick={handleStartRepair}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                title={t('startRepair')}
              >
                <BookCheck className="w-5 h-5" />
                {t('startRepair')}
              </button>
            )}

            {isTechnician && order.status === 'in_progress' && (
              <button
                onClick={handleFinishRepair}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                title={t('finishRepair')}
              >
                <BookCheck className="w-5 h-5" />
                {t('finishRepair')}
              </button>
            )}

            {isTechnician && order.status === 'completed' && (
              <button
                onClick={handleResumeRepair}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                title={t('resumeRepair')}
              >
                <BookCheck className="w-5 h-5" />
                {t('resumeRepair')}
              </button>
            )}

            <button
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              title={t('generatePDF')}
            >
              <FileText className="w-5 h-5" />
              {t('generatePDF')}
            </button>

      </div>


      <div className="flex items-center justify-end mb-6 gap-1">
          <div className="flex items-center gap-3">

            {order.is_emergency && (
              <span className="inline-flex items-center gap-1 px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm font-medium">
                🚨 {t('emergency')}
              </span>
            )}

          </div>

          <div>
            <span className={`px-4 py-2 rounded-md text-sm font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
              {getStatusLabel(order.status)}
            </span>
          </div>
        </div>
      
      </div>
      
      <div className="grid gap-2 grid-cols-2">
      

      <div className=" bg-white rounded-lg shadow-md p-6">
        <div className="space-y-6">
          {/* Client and Location */}
          
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1 flex gap-2"><Mountain />{t('client')}</h3>
              <Link href={`/dashboard/clients/${order.client_id}`} className="text-gray-900 pl-8 hover:underline">
                {order.client?.name || '-'}
              </Link>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1 flex gap-2"><MapPin /> {t('location')}</h3>
              <p className="text-gray-900 pl-8">
                
                {order.location?.name}<br />
                {order.location?.address} {order.location?.number}
                
                {order.location?.zip && `, ${order.location.zip}`}
                {order.location?.city && ` ${order.location.city}`}</p>
              <h3 className="text-sm font-semibold text-slate-900 mt-3 mb-1 flex gap-2"><FingerprintPattern /> {tL('nipColumn')}</h3>
              <p className="text-grey-900 pl-8"> {order.location?.nip && `${order.location.nip}`}</p>
              
            </div>
          
        </div>
      </div>

      <div className=" bg-white rounded-lg grid gap-1.5 shadow-md p-6">

          {/* Service Category */}
          <div>
            <h3 className="text-sm text-gray-500 mb-2 flex gap-2">{t('serviceCategory')}</h3>
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
              <h3 className="text-sm text-gray-500 mb-1">{t('description')}</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{order.description}</p>
            </div>
          )}

          {/* Order Dates */}
          <div className="grid grid-cols-2 gap-4 pt-6">
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
            {order.end_at && (
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('endAt')}</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(order.end_at)}
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



      </div>

      {isTechnician && (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('workReport')}</h3>
        <textarea
          value={workReport}
          onChange={(e) => {
            setWorkReport(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 400) + 'px';
          }}
          onInput={(e) => {
            e.currentTarget.style.height = 'auto';
            e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 400) + 'px';
          }}
          placeholder={t('workReportPlaceholder')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={5}
          style={{ minHeight: '120px' }}
        />
        <button
          onClick={handleSaveWorkReport}
          disabled={isSavingWorkReport}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSavingWorkReport ? tCommon('saving') : t('saveWorkReport')}
        </button>
      </div>
      )}

      {isTechnician && (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">
            {t('materials')}
          </h3>
          <div className="text-sm font-semibold text-gray-900">
            {t('totalMaterialsPrice')}: {materials
              .reduce((sum, m) => sum + (parseFloat(m.price) || 0), 0)
              .toFixed(2)} PLN
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {materials.map((material, index) => (
            <div key={index} className="flex gap-3 items-start">
              <input
                type="text"
                placeholder={t('materialNamePlaceholder')}
                value={material.name}
                onChange={(e) => handleMaterialChange(index, 'name', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="0.00"
                value={material.price}
                onChange={(e) => handleMaterialChange(index, 'price', e.target.value)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0"
              />
              <button
                onClick={() => handleRemoveMaterial(index)}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
              >
                {t('materialRemove')}
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddMaterial}
          className="block mb-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {t('addNextMaterial')}
        </button>

        <button
          onClick={handleSaveMaterials}
          disabled={isSavingMaterials}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSavingMaterials ? tCommon('saving') : tCommon('save')}
        </button>
      </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          {t('repairPhotos')}
        </h3>

        {isTechnician && (
          <div className="mb-6">
            <div className="border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 rounded-lg p-6 text-center cursor-pointer transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) {
                    handlePhotoUpload(e.target.files);
                  }
                }}
                className="hidden"
                id="photo-input"
                disabled={isLoadingData || isUploading}
              />
              <label htmlFor="photo-input" className="cursor-pointer">
                <div className="text-blue-600 hover:text-blue-700 font-medium">
                  {isUploading ? t('photosUploading') : t('dragDropPhotos')}
                </div>
              </label>
            </div>

            {isUploading && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {t('photosUploading')}
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}

        {photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map((photo, index) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.url}
                  alt="Repair photo"
                  className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    setLightboxIndex(index);
                    setLightboxOpen(true);
                  }}
                />
                {isTechnician && (
                  <button
                    onClick={() => handlePhotoDelete(photo.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold"
                    title={t('deletePhoto')}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            {t('noPhotos')}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={photos.map((p) => ({ src: p.url }))}
          index={lightboxIndex}
        />
      )}

      { !isTechnician && (
      <div className="bg-white rounded-lg grid gap-1.5 shadow-md p-6">

          {/* Technician */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1 flex gap-2"><UserRound />{t('technician')}</h3>
            <p className="text-gray-900 pl-8">
              {order.technician
                ? `${order.technician.first_name} ${order.technician.last_name}`
                : '-'}
            </p>
          </div>
      </div>
      )}
      </div>

      {/* Modals */}
      <OrderFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        order={order}
      />
      <AssignTechnicianModal
        isOpen={isAssignModalOpen}
        onClose={handleCloseAssignModal}
        order={order}
      />
    </div>
  );
}
