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
            $table->enum('role', ['admin', 'client', 'technician'])->default('technician')->after('email');
            $table->string('first_name')->nullable()->after('role');
            $table->string('last_name')->nullable()->after('first_name');
            $table->string('phone')->nullable()->after('last_name');
            $table->softDeletes()->after('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'first_name', 'last_name', 'phone']);
            $table->dropSoftDeletes();
        });
    }
};
