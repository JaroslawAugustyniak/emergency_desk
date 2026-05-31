<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('verification_code')->nullable()->after('email');
            $table->timestamp('verification_code_expires')->nullable()->after('verification_code');
            $table->string('reset_password_token')->nullable()->after('verification_code_expires');
            $table->timestamp('reset_password_expires')->nullable()->after('reset_password_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'verification_code',
                'verification_code_expires',
                'reset_password_token',
                'reset_password_expires',
            ]);
        });
    }
};
