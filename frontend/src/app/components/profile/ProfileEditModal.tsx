'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/app/components/ui/Modal';
import { updateProfile } from '@/lib/actions/profile';
import { useTranslations } from 'next-intl';
import Swal from 'sweetalert2';
import { useSessionContext } from '@/app/components/providers/SessionProvider';

type ProfileEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ProfileEditModal({
  isOpen,
  onClose,
}: ProfileEditModalProps) {
  const router = useRouter();
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const { user, setUser, setToken } = useSessionContext();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setError(null);
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate passwords match
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError(t('passwordsNotMatch'));
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError(t('savingError'));
        setIsSubmitting(false);
        return;
      }

      await updateProfile(token, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.newPassword || undefined,
        currentPassword: formData.currentPassword || undefined,
      });

      // Update user data in context
      if (user) {
        setUser({
          ...user,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
        });
      }

      // Show success message and logout
      await Swal.fire({
        title: t('logoutWarningTitle'),
        text: t('logoutWarning'),
        icon: 'success',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK',
      });

      // Clear token and redirect to login
      setToken(null);
      router.push('/login');
    } catch (err) {
      if (err instanceof Error) {
        switch (err.message) {
          case 'NAME_REQUIRED':
            setError(t('nameRequired'));
            break;
          case 'EMAIL_REQUIRED':
            setError(t('emailRequired'));
            break;
          case 'EMAIL_IN_USE':
            setError(t('emailInUse'));
            break;
          case 'CURRENT_PASSWORD_REQUIRED':
            setError(t('currentPasswordRequired'));
            break;
          case 'CURRENT_PASSWORD_INCORRECT':
            setError(t('currentPasswordIncorrect'));
            break;
          default:
            setError(t('savingError'));
        }
      } else {
        setError(t('savingError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('editProfile')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* First Name */}
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

        {/* Last Name */}
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

          {/* Email */}
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
            />
          </div>

          
          {/* Password Change Section */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-sm text-gray-500 mb-3">
              {t('passwordChangeNote')}
            </p>

            {/* Current Password */}
            <div className="mb-3">
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t('currentPassword')}
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* New Password */}
            <div className="mb-3">
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t('newPassword')}
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t('confirmPassword')}
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

        {/* Buttons */}
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
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t('saving') : t('saveChanges')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
