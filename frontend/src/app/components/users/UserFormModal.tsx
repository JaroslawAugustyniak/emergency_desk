'use client';

import { useState, useEffect, useMemo } from 'react';
import Modal from '@/app/components/ui/Modal';
import { createUser, updateUser } from '@/lib/actions/users';
import { getClients } from '@/lib/actions/clients';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import { calculatePasswordStrength } from '@/lib/passwordStrength';

type User = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  client_id?: number | null;
};

type UserFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSuccess?: () => void;
  presetRole?: string;
  presetClientId?: number;
};

export default function UserFormModal({
  isOpen,
  onClose,
  user = null,
  onSuccess,
  presetRole,
  presetClientId,
}: UserFormModalProps) {
  const router = useRouter();
  const { token } = useSessionContext();
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'technician',
    phone: '',
    password: '',
    client_id: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Array<{ id: number; name: string }>>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  const t = useTranslations('users');
  const c = useTranslations('common');
  const a = useTranslations('auth');

  const isEditMode = !!user;

  const passwordStrength = useMemo(
    () => calculatePasswordStrength(formData.password),
    [formData.password]
  );

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        phone: user.phone || '',
        password: '',
        client_id: user.client_id ? String(user.client_id) : '',
      });
    } else {
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        role: presetRole || 'technician',
        phone: '',
        password: '',
        client_id: presetClientId ? String(presetClientId) : '',
      });
    }
  }, [user, isOpen, presetRole, presetClientId]);

  useEffect(() => {
    if (!token || !isOpen || formData.role !== 'client' || presetClientId) return;

    const fetchClients = async () => {
      try {
        setIsLoadingClients(true);
        const data = await getClients({ per_page: 100 }, token);
        setClients(data.data || []);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setClients([]);
      } finally {
        setIsLoadingClients(false);
      }
    };

    fetchClients();
  }, [token, isOpen, formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!token) {
      setIsSubmitting(false);
      return;
    }

    if (!isEditMode && !formData.password) {
      setIsSubmitting(false);
      return;
    }

    if (formData.password && (formData.password.length < 8 || passwordStrength.score < 3)) {
      setIsSubmitting(false);
      return;
    }

    try {
      if (isEditMode && user) {
        await updateUser(
          user.id,
          {
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: formData.role,
            phone: formData.phone,
            ...(formData.password && { password: formData.password }),
            ...(formData.client_id && { client_id: Number(formData.client_id) }),
          },
          token
        );
      } else {
        await createUser(
          {
            email: formData.email,
            password: formData.password,
            role: formData.role,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            ...(formData.client_id && { client_id: Number(formData.client_id) }),
          },
          token
        );
      }

      router.refresh();
      onSuccess?.();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('firstName')}
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              
            />
          </div>

          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('lastName')}
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t('email')}
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t('enterEmailAddressExample')}
          />
        </div>

        {!presetRole && (
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('role')}
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="admin">Admin</option>
              <option value="technician">Technician</option>
              <option value="client">Client</option>
            </select>
          </div>
        )}

        {formData.role === 'client' && !presetClientId && (
          <div>
            <label
              htmlFor="client_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('client')}
            </label>
            {isLoadingClients ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                {c('loading')}...
              </div>
            ) : (
              <select
                id="client_id"
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- {c('selectOption')} --</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    c{client.id} - {client.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t('phone')}
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            
          />
        </div>

        {!isEditMode && (
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('password')}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!isEditMode}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              
            />

            {formData.password && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    {a(passwordStrength.labelKey)}
                  </span>
                </div>

                {passwordStrength.suggestionKeys.length > 0 && (
                  <ul className="text-xs text-gray-600 space-y-1 bg-gray-50 p-2 rounded">
                    {passwordStrength.suggestionKeys.map((suggestionKey, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-gray-400 mt-0.5">•</span>
                        <span>{a(suggestionKey)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {isEditMode && (
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t('newPassword')} ({c('optional')})
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('newPasswordPlaceholder')}
            />

            {formData.password && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700">
                    {a(passwordStrength.labelKey)}
                  </span>
                </div>

                {passwordStrength.suggestionKeys.length > 0 && (
                  <ul className="text-xs text-gray-600 space-y-1 bg-gray-50 p-2 rounded">
                    {passwordStrength.suggestionKeys.map((suggestionKey, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-gray-400 mt-0.5">•</span>
                        <span>{a(suggestionKey)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
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
            disabled={
              isSubmitting ||
              (!isEditMode && !formData.password) ||
              (!!formData.password && (formData.password.length < 8 || passwordStrength.score < 3))
            }
            className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? c('saving')
              : isEditMode
              ? c('save')
              : t('addUser')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
