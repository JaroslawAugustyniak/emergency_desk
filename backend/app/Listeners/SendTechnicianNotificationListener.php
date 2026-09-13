<?php

namespace App\Listeners;

use App\Events\TechnicianAssignedToOrder;
use App\Jobs\SendTechnicianNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendTechnicianNotificationListener implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(TechnicianAssignedToOrder $event): void
    {
        // Dispatch job with 30 minute delay
        SendTechnicianNotification::dispatch($event->order, $event->technician)
            ->delay(now()->addMinutes(30));

        \Log::info('Push notification queued for technician', [
            'technician_id' => $event->technician->id,
            'order_id' => $event->order->id,
            'delay_minutes' => 30,
        ]);
    }
}
