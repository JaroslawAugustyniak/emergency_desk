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

        $subscriptions = PushSubscription::where('user_id', $userId)->get();
        if ($subscriptions->isEmpty()) {
            throw new \Exception("No push subscriptions found for user {$user->email}");
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

        $successCount = 0;
        $failureCount = 0;
        $errors = [];

        foreach ($subscriptions as $subscription) {
            try {
                $pushSubscription = Subscription::create([
                    'endpoint' => $subscription->endpoint,
                    'publicKey' => $subscription->p256dh,
                    'authToken' => $subscription->auth,
                ]);

                $webPush->queueNotification(
                    $pushSubscription,
                    json_encode($pushMessage)
                );

                $successCount++;
            } catch (\Exception $e) {
                \Log::error('Failed to queue notification', [
                    'user_id' => $userId,
                    'subscription_id' => $subscription->id,
                    'error' => $e->getMessage(),
                ]);
                $failureCount++;
                $errors[] = $e->getMessage();
            }
        }

        $webPush->flush();

        \Log::info('Push notification sent', [
            'user_id' => $userId,
            'order_id' => $orderId,
            'sent' => $successCount,
            'failed' => $failureCount,
        ]);

        return [
            'success' => $failureCount === 0,
            'sent' => $successCount,
            'failed' => $failureCount,
            'user' => $user->email,
            'message' => $message,
            'errors' => $errors,
        ];
    }
}
