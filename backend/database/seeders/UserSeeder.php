<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        User::create([
            'email' => 'admin@emergencydesk.ai',
            'password' => Hash::make('Password123'),
            'role' => 'admin',
            'first_name' => 'Admin',
            'last_name' => 'User',
            'phone' => '+48123456789',
            'email_verified_at' => now(),
        ]);

        // Create sample client
        User::create([
            'email' => 'client@example.com',
            'password' => Hash::make('password123'),
            'role' => 'client',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'phone' => '+48234567890',
            'email_verified_at' => now(),
        ]);

        // Create sample technician
        User::create([
            'email' => 'technician@example.com',
            'password' => Hash::make('password123'),
            'role' => 'technician',
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'phone' => '+48345678901',
            'email_verified_at' => now(),
        ]);

        // Create additional technicians for testing
        for ($i = 1; $i <= 5; $i++) {
            User::create([
                'email' => "technician{$i}@example.com",
                'password' => Hash::make('password123'),
                'role' => 'technician',
                'first_name' => 'Tech',
                'last_name' => "Person{$i}",
                'phone' => "+48" . str_pad($i, 8, "0", STR_PAD_LEFT) . rand(1000, 9999),
                'email_verified_at' => now(),
            ]);
        }

        // Create additional clients for testing
        for ($i = 1; $i <= 3; $i++) {
            User::create([
                'email' => "client{$i}@example.com",
                'password' => Hash::make('password123'),
                'role' => 'client',
                'first_name' => 'Client',
                'last_name' => "Company{$i}",
                'phone' => "+48" . str_pad(100 + $i, 8, "0", STR_PAD_LEFT) . rand(1000, 9999),
                'email_verified_at' => now(),
            ]);
        }
    }
}
