<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Material extends Model
{
    use HasFactory;

    protected $fillable = ['order_id', 'name', 'price'];

    protected $casts = [
        'price' => 'float',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
