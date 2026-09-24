<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PushNotification extends Model
{
    protected $fillable = [
        'user_id',
        'order_id',
        'type',
        'title',
        'body',
        'url',
        'data',
        'is_sent',
        'no_subscription',
        'sent_at',
        'send_after',
    ];

    protected $casts = [
        'data' => 'array',
        'is_sent' => 'boolean',
        'no_subscription' => 'boolean',
        'sent_at' => 'datetime',
        'send_after' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('is_sent', false);
    }

    public function scopeDue(Builder $query): Builder
    {
        return $query->pending()->where('send_after', '<=', now());
    }
}
