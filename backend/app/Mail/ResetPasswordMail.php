<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $token
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            to: $this->user->email,
            subject: 'Reset Your Password',
        );
    }

    public function content(): Content
    {
        $frontendUrl = config('app.frontend_url') ?? 'http://app.starter.localhost';
        $resetLink = "{$frontendUrl}/reset-password?token={$this->token}";

        return new Content(
            view: 'emails.reset-password',
            with: [
                'user' => $this->user,
                'token' => $this->token,
                'resetLink' => $resetLink,
            ],
        );
    }
}