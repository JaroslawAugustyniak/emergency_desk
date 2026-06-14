<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('address');
            $table->string('number');
            $table->string('zip');
            $table->string('city');
            $table->string('country')->default('pl');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade');
            $table->timestamps();
            $table->softDeletes();

            $table->index('client_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('locations');
    }
};
