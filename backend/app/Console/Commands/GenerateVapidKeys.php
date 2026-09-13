<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Minishlink\WebPush\WebPush;

class GenerateVapidKeys extends Command
{
    protected $signature = 'app:generate-vapid-keys';

    protected $description = 'Generate VAPID keys for Web Push notifications';

    public function handle()
    {
        $this->info('Generating VAPID keys for Web Push...');

        try {
            $vapidKeys = WebPush::generateVAPIDKeys();

            $this->newLine();
            $this->info('✅ VAPID keys generated successfully!');
            $this->newLine();

            $this->line('Add these to your .env file:');
            $this->newLine();

            $this->line('<fg=green>VAPID_PUBLIC_KEY=' . $vapidKeys['publicKey'] . '</>');
            $this->line('<fg=green>VAPID_PRIVATE_KEY=' . $vapidKeys['privateKey'] . '</>');

            $this->newLine();
            $this->line('Also add the public key to frontend as NEXT_PUBLIC_VAPID_PUBLIC_KEY:');
            $this->newLine();
            $this->line('<fg=cyan>NEXT_PUBLIC_VAPID_PUBLIC_KEY=' . $vapidKeys['publicKey'] . '</>');

            $this->newLine();
            $this->warn('⚠️  Keep VAPID_PRIVATE_KEY secret! Never commit it to git!');

        } catch (\Exception $e) {
            $this->error('Failed to generate VAPID keys: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
