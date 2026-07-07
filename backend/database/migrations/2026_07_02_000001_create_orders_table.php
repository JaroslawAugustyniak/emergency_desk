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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->unsignedBigInteger('client_id');
            $table->unsignedBigInteger('technician_id')->nullable();
            $table->unsignedBigInteger('location_id');
            $table->unsignedBigInteger('service_category_id');
            $table->enum('status', ['new', 'assigned', 'in_progress', 'paused', 'completed', 'invoiced'])->default('new');
            $table->text('description')->nullable();
            $table->text('stop_reason')->nullable();
            $table->decimal('vat_rate', 5, 2)->default(23.00);
            $table->boolean('is_emergency')->default(false);
            $table->string('client_ref_no')->nullable();
            $table->string('invoice_no')->nullable();
            $table->decimal('price_total', 10, 2)->nullable();
            $table->text('work_report')->nullable();
            $table->dateTime('order_date');
            $table->dateTime('start_at')->nullable();
            $table->dateTime('end_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('client_id')->references('id')->on('clients')->onDelete('cascade');
            $table->foreign('technician_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('location_id')->references('id')->on('locations')->onDelete('cascade');
            $table->foreign('service_category_id')->references('id')->on('service_categories')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
