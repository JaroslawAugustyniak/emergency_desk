<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProtocolMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    private Order $order;
    private string $filePath;

    public function __construct(Order $order, string $filePath)
    {
        $this->order = $order;
        $this->filePath = $filePath;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Protokół zlecenia #' . str_pad($this->order->id, 8, '0', STR_PAD_LEFT),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.protocol',
            with: [
                'order' => $this->order,
                'orderNumber' => sprintf(
                    'C%s/P%s/O%s',
                    str_pad($this->order->client_id ?? 0, 3, '0', STR_PAD_LEFT),
                    str_pad($this->order->location_id ?? 0, 3, '0', STR_PAD_LEFT),
                    str_pad($this->order->id, 8, '0', STR_PAD_LEFT)
                ),
                'locationName' => $this->order->location?->name ?? '—',
            ],
        );
    }

    public function attachments(): array
    {
        if (!file_exists($this->filePath)) {
            \Log::warning('Protocol file not found for attachment', [
                'filePath' => $this->filePath,
                'orderId' => $this->order->id,
            ]);
            return [];
        }

        return [
            Attachment::fromPath($this->filePath)
                ->as('protokol-zlecenia.pdf')
                ->withMime('application/pdf'),
        ];
    }
}
