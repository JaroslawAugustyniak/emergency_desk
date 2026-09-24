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
        Schema::create('push_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('order_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('type');
            $table->string('title');
            $table->text('body');
            $table->string('url')->nullable();
            $table->json('data')->nullable();
            $table->boolean('is_sent')->default(false);
            $table->boolean('no_subscription')->default(false);
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('send_after');
            $table->timestamps();

            // At most one pending notification per (user_id, type) is enforced in application code;
            // this index makes both that lookup and the cancellation delete fast.
            $table->index(['user_id', 'type', 'is_sent']);
            // Used by the queue worker to find due, unsent notifications.
            $table->index(['is_sent', 'send_after']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('push_notifications');
    }
};
