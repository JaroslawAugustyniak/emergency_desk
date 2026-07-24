import { useCallback, useEffect, useState } from 'react';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if push notifications are supported
  useEffect(() => {
    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window &&
      isMobile;

    setIsSupported(supported);

    if (supported && Notification.permission === 'granted') {
      checkSubscription();
    }
  }, [isMobile]);

  const checkSubscription = useCallback(async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }, [isSupported]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Push notifications not supported on this device');
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Register subscription with backend
      const registration = await navigator.serviceWorker.ready;
      const subscriptionOptions: PushSubscriptionOptionsInit = {
        userVisibleOnly: true,
      };

      // Add VAPID key if available (for production)
      if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        subscriptionOptions.applicationServerKey = urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        );
      }

      const subscription = await registration.pushManager.subscribe(
        subscriptionOptions
      );

      // Send subscription to backend
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          auth: btoa(
            String.fromCharCode.apply(
              null,
              Array.from(
                new Uint8Array(subscription.getKey('auth') as ArrayBuffer)
              )
            )
          ),
          p256dh: btoa(
            String.fromCharCode.apply(
              null,
              Array.from(
                new Uint8Array(subscription.getKey('p256dh') as ArrayBuffer)
              )
            )
          ),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register subscription');
      }

      setIsSubscribed(true);
      return { success: true, message: 'Push notifications enabled' };
    } catch (error) {
      console.error('Error requesting permission:', error);
      throw error;
    }
  }, [isSupported]);

  const sendTestNotification = useCallback(async () => {
    try {
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    isMobile,
    requestPermission,
    sendTestNotification,
    checkSubscription,
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  if (!base64String) {
    return new Uint8Array();
  }

  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
