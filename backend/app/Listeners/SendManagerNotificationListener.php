<?php

namespace App\Listeners;

use App\Events\NewOrderInEmergency;
use App\Services\PushNotificationQueueService;
use App\Models\User;

class SendManagerNotificationListener
{
    public const NOTIFICATION_TYPE = 'new_order';

    public function __construct(private PushNotificationQueueService $queueService)
    {
    }

    public function handle(NewOrderInEmergency $event): void
    {
        $author = User::find($event->order->user_id);

        // Nie wysyłaj powiadomienia jeśli autor to manager lub admin
        if ($author && in_array($author->role, ['tech_manager', 'admin'])) {
            return;
        }

        $managers = User::query()
                    ->where('role', 'tech_manager')
                    ->where('status', 'active')
                    ->get();

        

        $managers_ids = [];
        $notifications_ids = [];

        $orderId = str_pad($event->order->id, 4, '0', STR_PAD_LEFT);
        $clientId = str_pad($event->order->client_id ?? 0, 3, '0', STR_PAD_LEFT);
        $locationId = str_pad($event->order->location_id ?? 0, 3, '0', STR_PAD_LEFT);
        $formattedOrderNumber = "C{$clientId}/P{$locationId}/O{$orderId}";

        foreach ($managers as $index => $manager) {

            array_push($managers_ids, $manager->id);

            $notification = $this->queueService->queue(
                userId: $manager->id,
                type: self::NOTIFICATION_TYPE,
                title: 'Nowe zlecenie',
                body: 'Pojawiło się nowe zlecenie nr: ' . $formattedOrderNumber .', utworzone przez '. $author->first_name.' '.$author->last_name.' dla '.$event->order->location->name,
                url: '/dashboard/orders/' . $event->order->id,
                orderId: $event->order->id,
                delayMinutes: config('push.assign_technician_delay_minutes'),
            );

            array_push($notifications_ids, $notification->id);

        }

        \Log::info('Push notification queued for managers', [
            'managers_ids' => $managers_ids,
            'order_id' => $event->order->id,
            'notifications_ids' => $notifications_ids,
            'send_after' => $notification->send_after,
        ]);
    }
}
