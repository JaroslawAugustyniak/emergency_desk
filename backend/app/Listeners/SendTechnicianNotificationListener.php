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
        // Assignment changed - cancel the outgoing technician's pending notification
        // for this order so they don't get notified about a job they're no longer on.
        // getOriginal() still holds the pre-change value because the event is dispatched
        // before $order->save() (which would reset it via syncOriginal()).
        $previousTechnicianId = $event->order->getOriginal('technician_id');
        if ($previousTechnicianId && $previousTechnicianId !== $event->technician->id) {
            $this->queueService->cancelPending(
                $previousTechnicianId,
                self::NOTIFICATION_TYPE,
                $event->order->id,
            );
        }

        $orderId = str_pad($event->order->id, 4, '0', STR_PAD_LEFT);
        $clientId = str_pad($event->order->client_id ?? 0, 3, '0', STR_PAD_LEFT);
        $locationId = str_pad($event->order->location_id ?? 0, 3, '0', STR_PAD_LEFT);
        $formattedOrderNumber = "C{$clientId}/P{$locationId}/O{$orderId}";

        $notification = $this->queueService->queue(
            userId: $event->technician->id,
            type: self::NOTIFICATION_TYPE,
            title: 'Nowe zlecenie przypisane',
            body: 'Zostałeś przypisany do zlecenia: ' . $formattedOrderNumber,
            url: '/dashboard/orders/' . $event->order->id,
            orderId: $event->order->id,
            delayMinutes: config('push.assign_technician_delay_minutes'),
        );

        \Log::info('Push notification queued for technician', [
            'technician_id' => $event->technician->id,
            'order_id' => $event->order->id,
            'notification_id' => $notification->id,
            'send_after' => $notification->send_after,
        ]);
    }
}
