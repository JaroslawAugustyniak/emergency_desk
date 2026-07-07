'use client';

import { useState, useEffect } from 'react';
import Modal from '@/app/components/ui/Modal';
import { createOrder, updateOrder } from '@/lib/actions/orders';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import { getClients } from '@/lib/actions/clients';
import { getLocationsByClient, type Location } from '@/lib/actions/locations';
import { getServiceCategories } from '@/lib/actions/serviceCategories';
import type { Order } from '@/lib/types/orders';

type Client = {
  id: number;
  name: string;
};

type ServiceCategory = {
  id: number;
  name: string;
  color: string;
};

type OrderFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  order?: Order | null;
  onSuccess?: () => void;
  clientId?: number;
  locationId?: number;
};

export default function OrderFormModal({
  isOpen,
  onClose,
  order = null,
  onSuccess,
  clientId,
  locationId,
}: OrderFormModalProps) {
  const router = useRouter();
  const { token } = useSessionContext();
  const [formData, setFormData] = useState({
    client_id: clientId || '',
    location_id: locationId || '',
    service_category_id: '',
    description: '',
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = useTranslations('orders');
  const tCommon = useTranslations('common');

  const isEditMode = !!order;
  const showClientSelect = !clientId && !locationId;
  const showLocationSelect = (clientId || formData.client_id) && !locationId;

  // Fetch clients on mount
  useEffect(() => {
    if (!token || isEditMode) return;

    const fetchClients = async () => {
      try {
        const data = await getClients({ per_page: 100 }, token);
        setClients(data.data || []);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    fetchClients();
  }, [token, isEditMode]);

  // Fetch locations when client is selected
  useEffect(() => {
    if (!token || isEditMode || !formData.client_id || locationId) return;

    const fetchLocations = async () => {
      try {
        setIsLoadingLocations(true);
        const data = await getLocationsByClient(Number(formData.client_id), token);
        setLocations(data.data || []);
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setIsLoadingLocations(false);
      }
    };

    fetchLocations();
  }, [formData.client_id, token, isEditMode, locationId]);

  // Fetch service categories when client is selected
  useEffect(() => {
    if (!token || isEditMode || !formData.client_id) return;

    const fetchServiceCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const data = await getServiceCategories(Number(formData.client_id), token);
        setServiceCategories(data.data || []);
      } catch (error) {
        console.error('Error fetching service categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchServiceCategories();
  }, [formData.client_id, token, isEditMode]);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && order) {
        // Initialize with order data for edit mode
        setFormData({
          client_id: String(order.client_id),
          location_id: String(order.location_id),
          service_category_id: String(order.service_category_id),
          description: order.description || '',
        });
        // Fetch locations and categories for edit mode
        if (order.client_id && token) {
          const fetchLocations = async () => {
            try {
              setIsLoadingLocations(true);
              const data = await getLocationsByClient(order.client_id, token);
              setLocations(data.data || []);
            } catch (error) {
              console.error('Error fetching locations:', error);
            } finally {
              setIsLoadingLocations(false);
            }
          };
          const fetchCategories = async () => {
            try {
              setIsLoadingCategories(true);
              const data = await getServiceCategories(order.client_id, token);
              setServiceCategories(data.data || []);
            } catch (error) {
              console.error('Error fetching service categories:', error);
            } finally {
              setIsLoadingCategories(false);
            }
          };
          fetchLocations();
          fetchCategories();
        }
      } else {
        // Initialize with empty form for create mode
        setFormData({
          client_id: clientId || '',
          location_id: locationId || '',
          service_category_id: '',
          description: '',
        });
      }
    }
    setError(null);
  }, [isOpen, isEditMode, order, clientId, locationId, token]);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      client_id: e.target.value,
      location_id: '',
      service_category_id: '',
    });
    setLocations([]);
    setServiceCategories([]);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      location_id: e.target.value,
    });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      service_category_id: e.target.value,
    });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      description: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!token) {
      setError('Not authenticated');
      setIsSubmitting(false);
      return;
    }

    // Validate required fields
    if (!formData.client_id || !formData.location_id || !formData.service_category_id) {
      setError(t('validateError') || 'Please fill all required fields');
      setIsSubmitting(false);
      return;
    }

    try {
      if (isEditMode && order) {
        await updateOrder(
          order.id,
          {
            description: formData.description || undefined,
          },
          token
        );
      } else {
        await createOrder(
          {
            client_id: Number(formData.client_id),
            location_id: Number(formData.location_id),
            service_category_id: Number(formData.service_category_id),
            description: formData.description || null,
            order_date: new Date().toISOString(),
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t('edit') : t('addNew')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client Select */}
        {showClientSelect && (
          <div>
            <label
              htmlFor="client_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('client')} *
            </label>
            <select
              id="client_id"
              value={formData.client_id}
              onChange={handleClientChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{tCommon('selectOption')}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Location Select */}
        {showLocationSelect && (
          <div>
            <label
              htmlFor="location_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('location')} *
            </label>
            <select
              id="location_id"
              value={formData.location_id}
              onChange={handleLocationChange}
              required
              disabled={isLoadingLocations}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">{tCommon('selectOption')}</option>
              {isLoadingLocations ? (
                <option disabled>Ładowanie...</option>
              ) : (
                locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.address} {location.number}
                    {location.city && ` - ${location.city}`}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        {/* Service Category Select */}
        {(formData.client_id || clientId) && !isEditMode && (
          <div>
            <label
              htmlFor="service_category_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('serviceCategory')} *
            </label>
            <select
              id="service_category_id"
              value={formData.service_category_id}
              onChange={handleCategoryChange}
              required
              disabled={isLoadingCategories || serviceCategories.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">{tCommon('selectOption')}</option>
              {isLoadingCategories ? (
                <option disabled>Ładowanie...</option>
              ) : serviceCategories.length === 0 ? (
                <option disabled>Brak kategorii</option>
              ) : (
                serviceCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t('description')}
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={handleDescriptionChange}
            placeholder={t('descriptionPlaceholder') || 'Enter order description...'}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
            disabled={isSubmitting || (!showClientSelect && !formData.client_id && !clientId)}
            className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? tCommon('saving') : isEditMode ? tCommon('save') : t('addOrder')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
