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
        Schema::table('photos', function (Blueprint $table) {
            // Make order_id nullable for temporary uploads
            $table->unsignedBigInteger('order_id')->nullable()->change();

            // Drop existing foreign key and recreate as nullable
            $table->dropForeign(['order_id']);
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade')->nullable();

            // Add user_id for tracking temporary uploads
            $table->unsignedBigInteger('user_id')->nullable()->after('order_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            // Update type column to include 'temporary'
            DB::statement("ALTER TABLE photos MODIFY COLUMN type ENUM('issue', 'work_completed', 'temporary') DEFAULT 'temporary'");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('photos', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');

            // Restore original foreign key
            $table->dropForeign(['order_id']);
            $table->unsignedBigInteger('order_id')->change();
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');

            // Revert type enum
            DB::statement("ALTER TABLE photos MODIFY COLUMN type ENUM('issue', 'work_completed') DEFAULT 'work_completed'");
        });
    }
};
