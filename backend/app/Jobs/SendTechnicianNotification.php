<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\User;
use App\Services\PushNotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

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

    public function handle(PushNotificationService $pushService): void
    {
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

        try {
            $result = $pushService->dispatchToUser($this->technician, $message);

            \Log::info('Push notification dispatch result for technician', [
                'technician_id' => $this->technician->id,
                'order_id' => $this->order->id,
                'sent' => $result['sent'],
                'failed' => $result['failed'],
                'errors' => $result['errors'],
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to send push notification to technician', [
                'technician_id' => $this->technician->id,
                'order_id' => $this->order->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
