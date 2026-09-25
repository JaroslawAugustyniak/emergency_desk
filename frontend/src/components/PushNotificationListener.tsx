'use client';

import { useUnreadPushNotifications } from '@/hooks/useUnreadPushNotifications';

export function PushNotificationListener() {
  useUnreadPushNotifications();

  // This component doesn't render anything, it just handles the logic
  return null;
}
