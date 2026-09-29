<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class MigrateSignaturesToStorage extends Command
{
    protected $signature = 'signatures:migrate-to-storage {--force : Skip confirmation}';

    protected $description = 'Migrate technician signatures from database (base64) to PNG files in storage';

    public function handle()
    {
        $this->info('🔄 Starting signature migration from database to storage...');

        $ordersWithSignatures = Order::whereNotNull('technician_signature')
            ->whereNull('technician_signature_path')
            ->count();

        if ($ordersWithSignatures === 0) {
            $this->info('✅ No signatures to migrate. All done!');
            return Command::SUCCESS;
        }

        $this->info("Found {$ordersWithSignatures} orders with signatures to migrate");

        if (!$this->option('force')) {
            if (!$this->confirm("Migrate {$ordersWithSignatures} signatures? This will create PNG files in storage/signatures/")) {
                $this->info('Migration cancelled.');
                return Command::SUCCESS;
            }
        }

        $this->info('📁 Creating signatures directory structure...');

        $migrated = 0;
        $failed = 0;
        $skipped = 0;

        $orders = Order::whereNotNull('technician_signature')
            ->whereNull('technician_signature_path')
            ->cursor();

        foreach ($orders as $order) {
            try {
                $dataUrl = $order->technician_signature;

                // Validate it's a proper data URL
                if (!str_starts_with($dataUrl, 'data:image/png;base64,')) {
                    $this->warn("Order {$order->id}: Invalid signature format, skipping");
                    $skipped++;
                    continue;
                }

                // Decode base64
                $base64Data = str_replace('data:image/png;base64,', '', $dataUrl);
                $png = base64_decode($base64Data, true);

                if ($png === false) {
                    $this->warn("Order {$order->id}: Failed to decode base64");
                    $failed++;
                    continue;
                }

                // Save to storage
                $path = "signatures/{$order->id}/signature.png";
                Storage::disk('public')->put($path, $png);

                // Update order record
                $order->update([
                    'technician_signature_path' => $path,
                ]);

                $migrated++;
                $this->line("✓ Order {$order->id}");

            } catch (\Exception $e) {
                $this->error("Order {$order->id}: {$e->getMessage()}");
                Log::error("Signature migration failed for order {$order->id}", [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                $failed++;
            }
        }

        // Summary
        $this->info("\n" . str_repeat('=', 60));
        $this->info("Migration Summary:");
        $this->info("  ✅ Migrated: {$migrated}");
        $this->info("  ⚠️  Skipped: {$skipped}");
        $this->info("  ❌ Failed: {$failed}");
        $this->info("  📊 Total: {$ordersWithSignatures}");
        $this->info(str_repeat('=', 60));

        if ($failed > 0) {
            $this->warn("\n⚠️  Some signatures failed to migrate. Check logs for details.");
            return Command::FAILURE;
        }

        $this->info("\n✅ Migration completed successfully!");
        return Command::SUCCESS;
    }
}
