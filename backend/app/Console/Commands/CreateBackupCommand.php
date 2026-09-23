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

            $this->info("Backup created successfully!");

            if (file_exists($backupPath)) {
                $size = filesize($backupPath);
                $sizeInMb = round($size / 1024 / 1024, 2);
                $this->info("Location: {$backupPath}");
                $this->info("Size: {$sizeInMb} MB");
            } else {
                $this->info("Location: {$backupPath}");
                $this->info("Note: Backup was uploaded to FTP and deleted locally");
            }

            return self::SUCCESS;
        } catch (Exception $e) {
            $this->error("Backup failed: " . $e->getMessage());
            return self::FAILURE;
        }
    }
}
