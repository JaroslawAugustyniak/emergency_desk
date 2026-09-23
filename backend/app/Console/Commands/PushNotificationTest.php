<?php

namespace App\Console\Commands;

use App\Services\PushNotificationService;
use Illuminate\Console\Command;

class PushNotificationTest extends Command
{
    protected $signature = 'push:test 
                            {user-id : ID użytkownika do wysłania powiadomienia}
                            {--message= : Treść wiadomości (domyślnie: "Powiadomienie testowe")}
                            {--order= : ID zlecenia (opcjonalne)}';

    protected $description = 'Wyślij push notification testowo (bez kolejkowania, natychmiastowo)';

    public function handle(PushNotificationService $pushService): int
    {
        $userId = $this->argument('user-id');
        $message = $this->option('message') ?? 'Powiadomienie testowe';
        $orderId = $this->option('order');

        $this->info("📤 Wysyłam powiadomienie...");
        $this->info("   Użytkownik: {$userId}");
        $this->info("   Wiadomość: {$message}");
        if ($orderId) {
            $this->info("   Zlecenie: {$orderId}");
        }
        $this->newLine();

        try {
            $result = $pushService->sendToUser((int)$userId, $message, $orderId ? (int)$orderId : null);

            if ($result['success']) {
                $this->info("✅ Powiadomienie wysłane!");
                $this->info("   Do: {$result['user']}");
                $this->info("   Wysłano: {$result['sent']}");
                if ($result['failed'] > 0) {
                    $this->warn("   Błędy: {$result['failed']}");
                }
                return 0;
            } else {
                $this->error("❌ Błąd przy wysyłaniu!");
                $this->info("   Wysłano: {$result['sent']}");
                $this->error("   Błędy: {$result['failed']}");
                foreach ($result['errors'] as $error) {
                    $this->error("   - {$error}");
                }
                return 1;
            }
        } catch (\Exception $e) {
            $this->error("❌ Błąd: {$e->getMessage()}");
            return 1;
        }
    }
}
