<?php

namespace App\Console\Commands;

use App\Services\PushNotificationQueueService;
use Illuminate\Console\Command;

class ProcessPushNotificationQueue extends Command
{
    protected $signature = 'push:work-queue {--once : Process due notifications once and exit, instead of looping forever}';

    protected $description = 'Continuously send queued push notifications once their send_after time arrives';

    private const POLL_INTERVAL_SECONDS = 30;

    public function handle(PushNotificationQueueService $queueService): int
    {
        $once = $this->option('once');

        $this->info('Push notification queue worker started' . ($once ? ' (single run)' : ''));

        while (true) {
            try {
                $stats = $queueService->processDue();

                if ($stats['processed'] > 0) {
                    $this->info(sprintf(
                        'Processed %d notification(s): %d sent, %d no subscription, %d failed',
                        $stats['processed'],
                        $stats['sent'],
                        $stats['no_subscription'],
                        $stats['failed']
                    ));

                    if (!empty($stats['errors'])) {
                        foreach ($stats['errors'] as $error) {
                            $this->error('  → ' . $error);
                        }
                    }
                }
            } catch (\Exception $e) {
                \Log::error('Push notification queue worker error', ['error' => $e->getMessage()]);
                $this->error('Error: ' . $e->getMessage());
            }

            if ($once) {
                break;
            }

            sleep(self::POLL_INTERVAL_SECONDS);
        }

        return 0;
    }
}
