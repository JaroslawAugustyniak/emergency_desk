<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;

class BackupService
{
    private string $backupDir;
    private string $storagePath;
    private string $dbName;
    private string $dbUser;
    private string $dbPassword;
    private string $dbHost;

    public function __construct()
    {
        $this->backupDir = storage_path('backups');
        $this->storagePath = storage_path('app/public');
        $this->dbName = config('database.connections.mysql.database');
        $this->dbUser = config('database.connections.mysql.username');
        $this->dbPassword = config('database.connections.mysql.password');
        $this->dbHost = config('database.connections.mysql.host');

        if (!is_dir($this->backupDir)) {
            mkdir($this->backupDir, 0755, true);
        }
    }

    /**
     * Tworzy kompletny backup bazy danych i plików
     */
    public function createFullBackup(): string
    {
        try {
            Log::info('Starting backup process...');

            $timestamp = now()->format('Y-m-d_H-i-s');
            $backupName = "backup_{$timestamp}";

            // Krok 1: Dump bazy danych
            $dbFile = $this->backupDir . "/{$backupName}_database.sql";
            $this->dumpDatabase($dbFile);
            Log::info("Database dumped to {$dbFile}");

            // Krok 2: Zaarchiwizuj bazę danych i pliki
            $archivePath = $this->backupDir . "/{$backupName}.tar.gz";
            $this->createArchive($archivePath, $dbFile);
            Log::info("Archive created at {$archivePath}");

            // Krok 3: Wyślij na serwer FTP (jeśli skonfigurowany)
            if ($this->isFtpConfigured()) {
                $this->uploadToFtp($archivePath, basename($archivePath));
                Log::info("Backup uploaded to FTP server");
            }

            // Krok 4: Sprzątanie - usuń tymczasowy plik SQL
            if (file_exists($dbFile)) {
                unlink($dbFile);
            }

            // Krok 5: Usuń stare backupy (starsze niż 30 dni)
            $this->cleanOldBackups(30);

            Log::info("Backup process completed successfully");

            return $archivePath;
        } catch (Exception $e) {
            Log::error("Backup failed: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Tworzy dump bazy danych MySQL
     */
    private function dumpDatabase(string $filePath): void
    {
        $command = sprintf(
            'mysqldump -h %s -u %s -p%s %s > %s',
            escapeshellarg($this->dbHost),
            escapeshellarg($this->dbUser),
            escapeshellarg($this->dbPassword),
            escapeshellarg($this->dbName),
            escapeshellarg($filePath)
        );

        $output = null;
        $returnCode = null;

        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            throw new Exception("Database dump failed with return code: $returnCode");
        }

        if (!file_exists($filePath) || filesize($filePath) === 0) {
            throw new Exception("Database dump file is empty or was not created");
        }
    }

    /**
     * Tworzy archiwum tar.gz z bazy danych i plików storage
     */
    private function createArchive(string $archivePath, string $dbFile): void
    {
        $tmpDir = $this->backupDir . '/temp_' . uniqid();
        mkdir($tmpDir, 0755, true);

        try {
            // Skopiuj plik bazy danych
            copy($dbFile, $tmpDir . '/database.sql');

            // Skopiuj pliki z storage/app/public
            if (is_dir($this->storagePath)) {
                $this->recursiveCopy($this->storagePath, $tmpDir . '/storage');
            }

            // Utwórz archiwum
            $command = sprintf(
                'cd %s && tar -czf %s .',
                escapeshellarg($tmpDir),
                escapeshellarg($archivePath)
            );

            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                throw new Exception("Archive creation failed with return code: $returnCode");
            }

            if (!file_exists($archivePath) || filesize($archivePath) === 0) {
                throw new Exception("Archive file is empty or was not created");
            }
        } finally {
            // Sprzątanie tymczasowego katalogu
            $this->recursiveRemove($tmpDir);
        }
    }

    /**
     * Wysyła plik na serwer FTP
     */
    private function uploadToFtp(string $localPath, string $remoteName): void
    {
        $ftpHost = config('backup.ftp.host');
        $ftpUser = config('backup.ftp.username');
        $ftpPass = config('backup.ftp.password');
        $ftpDir = config('backup.ftp.directory', '/backups/');

        if (!$ftpHost || !$ftpUser || !$ftpPass) {
            throw new Exception("FTP credentials are not configured");
        }

        $connection = ftp_connect($ftpHost);
        if (!$connection) {
            throw new Exception("Failed to connect to FTP server: {$ftpHost}");
        }

        if (!ftp_login($connection, $ftpUser, $ftpPass)) {
            ftp_close($connection);
            throw new Exception("FTP login failed");
        }

        // Ustaw pasywny tryb transferu
        ftp_pasv($connection, true);

        // Stwórz katalog na serwerze jeśli nie istnieje
        if (!@ftp_chdir($connection, $ftpDir)) {
            if (!@ftp_mkdir($connection, $ftpDir)) {
                ftp_close($connection);
                throw new Exception("Failed to create FTP directory: {$ftpDir}");
            }
        }

        // Wyślij plik
        $remoteFile = rtrim($ftpDir, '/') . '/' . $remoteName;
        if (!ftp_put($connection, $remoteFile, $localPath, FTP_BINARY)) {
            ftp_close($connection);
            throw new Exception("Failed to upload file to FTP: {$remoteFile}");
        }

        ftp_close($connection);
    }

    /**
     * Sprawdza czy FTP jest skonfigurowany
     */
    private function isFtpConfigured(): bool
    {
        return (bool) config('backup.ftp.host');
    }

    /**
     * Usuwa stare backupy starsze niż określona liczba dni
     */
    private function cleanOldBackups(int $days): void
    {
        $cutoffTime = now()->subDays($days)->getTimestamp();

        $files = glob($this->backupDir . '/backup_*.tar.gz');
        if (!$files) {
            return;
        }

        foreach ($files as $file) {
            if (is_file($file) && filemtime($file) < $cutoffTime) {
                unlink($file);
                Log::info("Deleted old backup: {$file}");
            }
        }
    }

    /**
     * Rekurencyjnie kopuje katalog
     */
    private function recursiveCopy(string $src, string $dst): void
    {
        if (!is_dir($dst)) {
            mkdir($dst, 0755, true);
        }

        $dir = opendir($src);
        if ($dir === false) {
            throw new Exception("Failed to open directory: {$src}");
        }

        while (($file = readdir($dir)) !== false) {
            if ($file === '.' || $file === '..') {
                continue;
            }

            $srcPath = "{$src}/{$file}";
            $dstPath = "{$dst}/{$file}";

            if (is_dir($srcPath)) {
                $this->recursiveCopy($srcPath, $dstPath);
            } else {
                copy($srcPath, $dstPath);
            }
        }

        closedir($dir);
    }

    /**
     * Rekurencyjnie usuwa katalog
     */
    private function recursiveRemove(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }

        $files = scandir($dir);
        if ($files === false) {
            return;
        }

        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }

            $path = "{$dir}/{$file}";
            if (is_dir($path)) {
                $this->recursiveRemove($path);
            } else {
                @unlink($path);
            }
        }

        @rmdir($dir);
    }
}
