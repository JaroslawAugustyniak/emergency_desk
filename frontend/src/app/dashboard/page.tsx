'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import Swal from 'sweetalert2';
import { Bell } from 'lucide-react';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const { user } = useSessionContext();
  const { isSupported, isSubscribed, isMobile, requestPermission, sendTestNotification } = usePushNotifications();
  const [isLoading, setIsLoading] = useState(false);

  const handlePushNotificationDemo = async () => {
    if (!isSupported) {
      await Swal.fire({
        title: 'Not Supported',
        text: 'Push notifications are only available on mobile devices',
        icon: 'info',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setIsLoading(true);

    try {
      // First, request permission if not already granted
      if (!isSubscribed) {
        await requestPermission();
      }

      // Send test notification
      await sendTestNotification();

      await Swal.fire({
        title: 'Success!',
        text: 'Push notification test sent! Check your notifications.',
        icon: 'success',
        confirmButtonColor: '#3b82f6',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send notification';
      await Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="">
      <h1 className="text-2xl font-bold md:mb-8">
        {t('welcome', {name: user?.first_name+' '+user?.last_name || 'Gościu'})}
      </h1>

      <p className="text-slate-600 mb-6">
        {t('summary')}
      </p>

      {/* Push Notification Demo Button */}
      {isMobile && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Push Notifications Demo</h3>
          </div>
          <p className="text-sm text-blue-800 mb-3">
            Test push notifications on your mobile device
          </p>
          <button
            onClick={handlePushNotificationDemo}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            {isLoading ? 'Sending...' : isSubscribed ? 'Send Test Notification' : 'Enable Push & Send Test'}
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row lg:flex-row lg:items-start gap-6">
        {/* Stoper */}
      </div>
    </div>
  );
}
