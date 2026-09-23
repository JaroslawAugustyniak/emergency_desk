<?php

namespace App\Console\Commands;

use App\Services\BackupService;
use Exception;
use Illuminate\Console\Command;

class CreateBackupCommand extends Command
{
    protected $signature = 'backup:create';

    protected $description = 'Create a backup of the database and storage files';

    public function handle(BackupService $backupService): int
    {
        try {
            $this->info('Creating backup...');

            $backupPath = $backupService->createFullBackup();

            $size = filesize($backupPath);
            $sizeInMb = round($size / 1024 / 1024, 2);

            $this->info("Backup created successfully!");
            $this->info("Location: {$backupPath}");
            $this->info("Size: {$sizeInMb} MB");

            return self::SUCCESS;
        } catch (Exception $e) {
            $this->error("Backup failed: " . $e->getMessage());
            return self::FAILURE;
        }
    }
}
