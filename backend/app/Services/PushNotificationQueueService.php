<?php

namespace App\Services;

use App\Models\PushNotification;
use Illuminate\Support\Carbon;

class PushNotificationQueueService
{
    public function __construct(private PushNotificationService $pushService)
    {
    }

    /**
     * Queue a notification for later delivery. Enforces the invariant that at most
     * one pending notification exists per (user_id, type) - any earlier pending
     * notification of the same type for this user is cancelled first.
     */
    public function queue(
        int $userId,
        string $type,
        string $title,
        string $body,
        ?string $url = null,
        ?array $data = null,
        ?int $orderId = null,
        int $delayMinutes = 30
    ): PushNotification {
        $this->cancelPending($userId, $type, $orderId);

        return PushNotification::create([
            'user_id' => $userId,
            'order_id' => $orderId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'url' => $url,
            'data' => $data,
            'is_sent' => false,
            'send_after' => now()->addMinutes($delayMinutes),
        ]);
    }

    /**
     * Delete any not-yet-sent notification of the given type for the given user,
     * e.g. because the technician assignment it was about has since changed.
     */
    public function cancelPending(int $userId, string $type, ?int $orderId = null): int
    {
        return PushNotification::pending()
            ->where('user_id', $userId)
            ->where('type', $type)
            ->where('order_id', $orderId)
            ->delete();
    }

    /**
     * Send every notification whose send_after has arrived. Always marks the
     * notification as sent (or no_subscription) afterwards - failed delivery is
     * still a processed notification, not something to retry indefinitely.
     */
    public function processDue(): array
    {
        $stats = ['processed' => 0, 'sent' => 0, 'no_subscription' => 0, 'failed' => 0];

        foreach (PushNotification::due()->with('user')->get() as $notification) {
            $stats['processed']++;

            $payload = [
                'title' => $notification->title,
                'body' => $notification->body,
                'icon' => '/images/favicon.png',
                'badge' => '/images/favicon.png',
                'tag' => $notification->type . '-' . $notification->id,
                'requireInteraction' => true,
                'data' => array_merge(
                    array_filter(['url' => $notification->url]),
                    $notification->data ?? []
                ),
            ];

            $updates = ['is_sent' => true, 'sent_at' => now()];

            try {
                $result = $this->pushService->dispatchToUser($notification->user, $payload);
                $stats['sent'] += $result['sent'];
            } catch (\Exception $e) {
                // "No push subscriptions found" is the expected case when the user
                // never enabled push notifications - not a delivery failure to retry.
                if (str_contains($e->getMessage(), 'No push subscriptions found')) {
                    $updates['no_subscription'] = true;
                    $stats['no_subscription']++;
                } else {
                    $stats['failed']++;
                    \Log::error('Failed to process queued push notification', [
                        'notification_id' => $notification->id,
                        'user_id' => $notification->user_id,
                        'type' => $notification->type,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            $notification->update($updates);
        }

        return $stats;
    }
}
