<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\User;
use App\Models\PushSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class SendTechnicianNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public Order $order;
    public User $technician;

    public function __construct(Order $order, User $technician)
    {
        $this->order = $order;
        $this->technician = $technician;
    }

    public function handle(): void
    {
        $subscriptions = PushSubscription::where('user_id', $this->technician->id)->get();

        if ($subscriptions->isEmpty()) {
            return;
        }

        $message = [
            'title' => 'Nowe zlecenie przypisane',
            'body' => 'Zostałeś przypisany do zlecenia: ' . $this->order->id,
            'icon' => '/images/favicon.png',
            'badge' => '/images/favicon.png',
            'tag' => 'order-assignment-' . $this->order->id,
            'requireInteraction' => true,
            'data' => [
                'orderId' => $this->order->id,
                'url' => '/orders/' . $this->order->id,
            ],
        ];

        $vapidPublicKey = env('VAPID_PUBLIC_KEY');
        $vapidPrivateKey = env('VAPID_PRIVATE_KEY');

        if (!$vapidPublicKey || !$vapidPrivateKey) {
            \Log::error('VAPID keys not configured');
            return;
        }

        $webPush = new WebPush([
            'VAPID' => [
                'subject' => 'mailto:' . env('MAIL_FROM_ADDRESS', 'no-reply@emergencydesk.com'),
                'publicKey' => $vapidPublicKey,
                'privateKey' => $vapidPrivateKey,
            ],
        ]);

        foreach ($subscriptions as $subscription) {
            try {
                $pushSubscription = Subscription::create([
                    'endpoint' => $subscription->endpoint,
                    'publicKey' => $subscription->p256dh,
                    'authToken' => $subscription->auth,
                ]);

                $webPush->queueNotification(
                    $pushSubscription,
                    json_encode($message)
                );
            } catch (\Exception $e) {
                \Log::error('Failed to queue notification', [
                    'subscription_id' => $subscription->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $webPush->flush();

        \Log::info('Push notification sent to technician', [
            'technician_id' => $this->technician->id,
            'order_id' => $this->order->id,
        ]);
    }
}
