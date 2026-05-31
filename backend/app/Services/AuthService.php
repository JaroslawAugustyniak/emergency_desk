<?php

namespace App\Services;

use App\Mail\ResetPasswordMail;
use App\Mail\VerifyEmailMail;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AuthService
{
    public function register(array $data): User
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $this->sendVerificationCode($user);

        return $user;
    }

    public function sendVerificationCode(User $user): void
    {
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->update([
            'verification_code' => $code,
            'verification_code_expires' => now()->addMinutes(15),
        ]);

        Mail::queue(new VerifyEmailMail($user, $code));
    }

    public function sendVerificationEmail(User $user): void
    {
        $this->sendVerificationCode($user);
    }

    public function verifyEmail(User $user, string $code): bool
    {
        if ($user->verification_code !== $code) {
            return false;
        }

        if ($user->verification_code_expires < now()) {
            return false;
        }

        $user->update([
            'email_verified_at' => now(),
            'verification_code' => null,
            'verification_code_expires' => null,
        ]);

        return true;
    }

    public function login(string $email, string $password): ?User
    {
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return null;
        }

        if (!$user->isEmailVerified()) {
            $this->sendVerificationCode($user);
            throw new \Exception('Email not verified');
        }

        return $user;
    }

    public function sendPasswordResetCode(User $user): void
    {
        $token = Str::random(32);

        $user->update([
            'reset_password_token' => $token,
            'reset_password_expires' => now()->addMinutes(15),
        ]);

        Mail::queue(new ResetPasswordMail($user, $token));
    }

    public function resetPassword(User $user, string $token, string $newPassword): bool
    {
        if ($user->reset_password_token !== $token) {
            return false;
        }

        if ($user->reset_password_expires < now()) {
            return false;
        }

        $user->update([
            'password' => Hash::make($newPassword),
            'reset_password_token' => null,
            'reset_password_expires' => null,
        ]);

        return true;
    }
}
