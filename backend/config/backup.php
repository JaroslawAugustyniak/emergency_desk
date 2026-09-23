<?php

return [
    'ftp' => [
        'host' => env('BACKUP_FTP_HOST'),
        'username' => env('BACKUP_FTP_USERNAME'),
        'password' => env('BACKUP_FTP_PASSWORD'),
        'directory' => env('BACKUP_FTP_DIRECTORY', '/backups/'),
        'delete_after_upload' => env('BACKUP_DELETE_AFTER_UPLOAD', true),
    ],

    'retention' => [
        'keep_count' => env('BACKUP_KEEP_COUNT', 3),
        'retention_days' => env('BACKUP_RETENTION_DAYS', 3),
    ],

    'schedule' => [
        'time' => env('BACKUP_SCHEDULE_TIME', '02:00'),
    ],
];
