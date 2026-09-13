<?php

namespace App\Events;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TechnicianAssignedToOrder
{
    use Dispatchable, SerializesModels;

    public Order $order;
    public User $technician;

    public function __construct(Order $order, User $technician)
    {
        $this->order = $order;
        $this->technician = $technician;
    }
}
