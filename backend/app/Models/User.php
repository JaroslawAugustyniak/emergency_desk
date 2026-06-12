<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasApiTokens, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'email',
        'password',
        'role',
        'first_name',
        'last_name',
        'phone',
        'email_verified_at',
        'verification_code',
        'verification_code_expires',
        'reset_password_token',
        'reset_password_expires',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'verification_code',
        'reset_password_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'verification_code_expires' => 'datetime',
            'reset_password_expires' => 'datetime',
        ];
    }

    protected function password(): Attribute
    {
        return Attribute::make(
            set: fn(?string $value) => $value ? Hash::make($value) : null,
        );
    }

    public function isEmailVerified(): bool
    {
        return $this->email_verified_at !== null;
    }
}
