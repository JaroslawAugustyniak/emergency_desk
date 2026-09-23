<?php

namespace App\Services;

use App\Models\Order;
use App\Models\PushSubscription;
use App\Models\User;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class PushNotificationService
{
    public function sendToUser(int $userId, string $message, ?int $orderId = null): array
    {
        $user = User::find($userId);
        if (!$user) {
            throw new \Exception("User {$userId} not found");
        }

        $pushMessage = [
            'title' => 'Powiadomienie z Emergency Desk',
            'body' => $message,
            'icon' => '/images/favicon.png',
            'badge' => '/images/favicon.png',
            'tag' => 'notification',
            'requireInteraction' => true,
        ];

        if ($orderId) {
            $order = Order::find($orderId);
            if ($order) {
                $pushMessage['data'] = [
                    'orderId' => $order->id,
                    'url' => "/orders/{$order->id}",
                ];
            }
        }

        $result = $this->dispatchToUser($user, $pushMessage);

        return array_merge($result, [
            'user' => $user->email,
            'message' => $message,
        ]);
    }

    /**
     * Send an arbitrary push payload to every subscription of the given user.
     * This is the single place that talks to the WebPush library and interprets
     * its delivery reports - queueNotification() alone does NOT send anything,
     * the actual HTTP calls happen inside flush().
     */
    public function dispatchToUser(User $user, array $pushMessage): array
    {
        $subscriptions = PushSubscription::where('user_id', $user->id)->get();
        if ($subscriptions->isEmpty()) {
            throw new \Exception("No push subscriptions found for user {$user->email}");
        }

        $vapidPublicKey = env('VAPID_PUBLIC_KEY');
        $vapidPrivateKey = env('VAPID_PRIVATE_KEY');

        if (!$vapidPublicKey || !$vapidPrivateKey) {
            throw new \Exception('VAPID keys not configured');
        }

        $webPush = new WebPush([
            'VAPID' => [
                'subject' => 'mailto:' . env('MAIL_FROM_ADDRESS', 'no-reply@emergencydesk.com'),
                'publicKey' => $vapidPublicKey,
                'privateKey' => $vapidPrivateKey,
            ],
        ]);

        // Map subscription endpoint -> DB row, so we can match reports back to records
        $subscriptionsByEndpoint = [];

        foreach ($subscriptions as $subscription) {
            $pushSubscription = Subscription::create([
                'endpoint' => $subscription->endpoint,
                'publicKey' => $subscription->p256dh,
                'authToken' => $subscription->auth,
            ]);

            $subscriptionsByEndpoint[$subscription->endpoint] = $subscription;

            $webPush->queueNotification(
                $pushSubscription,
                json_encode($pushMessage)
            );
        }

        $successCount = 0;
        $failureCount = 0;
        $errors = [];

        // flush() actually performs the HTTP calls to the push service (FCM/Mozilla/etc)
        // and returns a report per subscription - queueNotification() alone does NOT send anything.
        foreach ($webPush->flush() as $report) {
            $endpoint = $report->getEndpoint();

            if ($report->isSuccess()) {
                $successCount++;
                continue;
            }

            $failureCount++;
            $reason = $report->getReason();
            $errors[] = $reason;

            \Log::error('Push notification delivery failed', [
                'user_id' => $user->id,
                'endpoint' => substr($endpoint, 0, 50) . '...',
                'reason' => $reason,
                'expired' => $report->isSubscriptionExpired(),
            ]);

            // Subscription is no longer valid (410 Gone / 404) - remove it so we stop trying
            if ($report->isSubscriptionExpired() && isset($subscriptionsByEndpoint[$endpoint])) {
                $subscriptionsByEndpoint[$endpoint]->delete();
                \Log::info('Removed expired push subscription', [
                    'user_id' => $user->id,
                    'subscription_id' => $subscriptionsByEndpoint[$endpoint]->id,
                ]);
            }
        }

        \Log::info('Push notification send result', [
            'user_id' => $user->id,
            'sent' => $successCount,
            'failed' => $failureCount,
        ]);

        return [
            'success' => $successCount > 0,
            'sent' => $successCount,
            'failed' => $failureCount,
            'errors' => $errors,
        ];
    }
}
