<?php

return [
    'ftp' => [
        'host' => env('BACKUP_FTP_HOST'),
        'username' => env('BACKUP_FTP_USERNAME'),
        'password' => env('BACKUP_FTP_PASSWORD'),
        'directory' => env('BACKUP_FTP_DIRECTORY', '/backups/'),
    ],

    'retention_days' => env('BACKUP_RETENTION_DAYS', 30),

    'schedule' => [
        'time' => env('BACKUP_SCHEDULE_TIME', '02:00'),
    ],
];
