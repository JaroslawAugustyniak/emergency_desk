<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'order_number',
        'client_id',
        'technician_id',
        'location_id',
        'service_category_id',
        'status',
        'description',
        'stop_reason',
        'vat_rate',
        'is_emergency',
        'client_ref_no',
        'invoice_no',
        'price_total',
        'work_report',
        'order_date',
        'start_at',
        'end_at',
    ];

    protected $casts = [
        'order_date' => 'datetime',
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'is_emergency' => 'boolean',
        'vat_rate' => 'float',
        'price_total' => 'float',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function serviceCategory()
    {
        return $this->belongsTo(ServiceCategory::class, 'service_category_id');
    }
}
