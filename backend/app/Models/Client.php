<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Client extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'hash',
        'has_internal_no',
        'internal_no',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->hash)) {
                $model->hash = self::generateHash();
            }
        });
    }

    public static function generateHash(): string
    {
        return 'c' . Str::random(32);
    }

    public function regenerateHash(): void
    {
        $this->hash = self::generateHash();
        $this->save();
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function locations()
    {
        return $this->hasMany(Location::class);
    }

    public function serviceCategories()
    {
        return $this->hasMany(ServiceCategory::class);
    }
}
