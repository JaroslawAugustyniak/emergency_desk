<?php

namespace App\Listeners;

use App\Events\TechnicianAssignedToOrder;
use App\Services\PushNotificationQueueService;

class SendTechnicianNotificationListener
{
    public const NOTIFICATION_TYPE = 'assign_technician';

    public function __construct(private PushNotificationQueueService $queueService)
    {
    }

    public function handle(TechnicianAssignedToOrder $event): void
    {
        $notification = $this->queueService->queue(
            userId: $event->technician->id,
            type: self::NOTIFICATION_TYPE,
            title: 'Nowe zlecenie przypisane',
            body: 'Zostałeś przypisany do zlecenia: ' . $event->order->id,
            url: '/orders/' . $event->order->id,
            orderId: $event->order->id,
            delayMinutes: 30,
        );

        \Log::info('Push notification queued for technician', [
            'technician_id' => $event->technician->id,
            'order_id' => $event->order->id,
            'notification_id' => $notification->id,
            'send_after' => $notification->send_after,
        ]);
    }
}
