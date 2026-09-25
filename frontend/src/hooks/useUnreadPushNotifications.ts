import { useEffect, useRef, useCallback } from 'react';
import { useSessionContext } from '@/app/components/providers/SessionProvider';
import Swal from 'sweetalert2';

interface PushNotification {
  id: number;
  user_id: number;
  order_id: number | null;
  type: string;
  title: string;
  body: string;
  url: string | null;
  data: Record<string, any> | null;
  is_sent: boolean;
  is_read: boolean;
  no_subscription: boolean;
  sent_at: string | null;
  send_after: string;
  created_at: string;
  updated_at: string;
}

export function useUnreadPushNotifications() {
  const { token } = useSessionContext();
  const notificationQueueRef = useRef<PushNotification[]>([]);
  const isShowingModalRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      if (!token) {
        console.warn('No token available to mark notification as read');
        return;
      }

      console.log('Marking notification as read:', notificationId);
      const response = await fetch(`/api/push-notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to mark notification as read:', response.status, response.statusText);
        return;
      }

      const data = await response.json();
      console.log('Notification marked as read:', data);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [token]);

  const showNextNotification = useCallback(() => {
    if (notificationQueueRef.current.length === 0 || isShowingModalRef.current) {
      return;
    }

    isShowingModalRef.current = true;
    const notification = notificationQueueRef.current[0];

    Swal.fire({
      title: notification.title,
      html: notification.body,
      icon: 'info',
      confirmButtonText: notification.url ? 'Przejdź do zlecenia' : 'Zamknij',
      ...(notification.url && { showCancelButton: true, cancelButtonText: 'Zamknij' }),
      allowOutsideClick: false,
      allowEscapeKey: false,
      willClose: async () => {
        await markAsRead(notification.id);
      },
    }).then((result) => {
      if (result.isConfirmed && notification.url) {
        window.location.href = notification.url;
      }
      notificationQueueRef.current.shift();
      isShowingModalRef.current = false;
      showNextNotification();
    });
  }, [markAsRead]);

  const fetchUnreadNotifications = useCallback(async () => {
    try {
      if (!token) return;

      const response = await fetch('/api/push-notifications/unread', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch unread notifications:', response.status);
        return;
      }

      const data = await response.json();
      const notifications = data.data || [];

      // Add new notifications to queue
      for (const notification of notifications) {
        if (!notificationQueueRef.current.some(n => n.id === notification.id)) {
          notificationQueueRef.current.push(notification);
        }
      }

      // Show next notification if not already showing
      if (!isShowingModalRef.current) {
        showNextNotification();
      }
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error);
    }
  }, [token, showNextNotification]);

  useEffect(() => {
    if (!token) return;

    // Initial fetch
    fetchUnreadNotifications();

    // Set up interval to fetch every 30 seconds
    intervalRef.current = setInterval(() => {
      fetchUnreadNotifications();
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [token, fetchUnreadNotifications]);
}
