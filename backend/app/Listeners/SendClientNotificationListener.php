<?php

namespace App\Listeners;

use App\Events\OrderFinished;
use App\Services\PushNotificationQueueService;
use App\Models\User;
use App\Models\PushNotification;

class SendClientNotificationListener
{
    public const NOTIFICATION_TYPE = 'order_finished';

    public function __construct(private PushNotificationQueueService $queueService)
    {
    }

    public function handle(OrderFinished $event): void
    {
        
        // Nie wysyłaj powiadomienia jeśli location nie ma manager'a
        if ($event->order->location->user_id === null) {
            \Log::warning('OrderFinished event: location has no user_id', ['order_id' => $event->order->id]);
            return;
        }

        $manager = User::find($event->order->location->user_id);

        if (!$manager) {
            \Log::warning('OrderFinished event: manager user not found', ['order_id' => $event->order->id, 'user_id' => $event->order->location->user_id]);
            return;
        }

        $existed_notification = PushNotification::where('user_id', $manager->id)->where('order_id', $event->order->id)->where('type', self::NOTIFICATION_TYPE)->exists();

        if($existed_notification){
            return;
        }

        $orderId = str_pad($event->order->id, 4, '0', STR_PAD_LEFT);
        $clientId = str_pad($event->order->client_id ?? 0, 3, '0', STR_PAD_LEFT);
        $locationId = str_pad($event->order->location_id ?? 0, 3, '0', STR_PAD_LEFT);
        $formattedOrderNumber = "C{$clientId}/P{$locationId}/O{$orderId}";


            $notification = $this->queueService->queue(
                userId: $manager->id,
                type: self::NOTIFICATION_TYPE,
                title: 'Zlecenie zakończone',
                body: 'Twoje zlecenie nr: ' . $formattedOrderNumber .', zostało zakończone.',
                url: '/dashboard/orders/' . $event->order->id,
                orderId: $event->order->id,
                delayMinutes: config('push.assign_technician_delay_minutes'),
            );


        \Log::info('Push notification queued for managers', [
            'managers_ids' => $manager->id,
            'order_id' => $event->order->id,
            'notifications_ids' => $notification->id,
            'send_after' => $notification->send_after,
        ]);
    }
}
