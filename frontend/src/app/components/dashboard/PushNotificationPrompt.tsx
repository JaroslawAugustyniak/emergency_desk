'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Swal from 'sweetalert2';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const DISMISSED_KEY = 'push_notification_prompt_dismissed';

// Shown once after login when the browser supports push, the user hasn't
// decided yet at the browser permission level, and hasn't already been
// asked before (tracked in localStorage so it never reappears after that).
export default function PushNotificationPrompt() {
  const t = useTranslations('pushNotifications');
  const { isSupported, isSubscribed, permission, requestPermission } = usePushNotifications();
  const hasPromptedRef = useRef(false);

  useEffect(() => {
    if (hasPromptedRef.current) return;
    if (!isSupported) return;
    if (permission !== 'default') return;
    if (isSubscribed) return;
    if (localStorage.getItem(DISMISSED_KEY) === 'true') return;

    hasPromptedRef.current = true;

    Swal.fire({
      title: t('promptTitle'),
      text: t('promptMessage'),
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t('enableButton'),
      cancelButtonText: t('dismissButton'),
    }).then(async (result) => {
      localStorage.setItem(DISMISSED_KEY, 'true');

      if (result.isConfirmed) {
        try {
          await requestPermission();
        } catch (error) {
          console.error('Failed to enable push notifications:', error);
        }
      }
    });
  }, [isSupported, isSubscribed, permission, requestPermission, t]);

  return null;
}
