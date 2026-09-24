<?php

namespace App\Providers;

use App\Events\TechnicianAssignedToOrder;
use App\Events\NewOrderInEmergency;
use App\Events\OrderFinished;
use App\Listeners\SendTechnicianNotificationListener;
use App\Listeners\SendManagerNotificationListener;
use App\Listeners\SendClientNotificationListener;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
        TechnicianAssignedToOrder::class => [
            SendTechnicianNotificationListener::class,
        ],
        NewOrderInEmergency::class => [
            SendManagerNotificationListener::class,
        ],
        OrderFinished::class => [
            SendClientNotificationListener::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
