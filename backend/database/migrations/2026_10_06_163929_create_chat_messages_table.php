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
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();

            // Customer ka original message
            $table->text('customer_message');

            // AI ka response
            $table->text('ai_response')->nullable();

            // AI classification
            $table->string('category')->nullable();

            // AI priority
            $table->string('priority')->nullable();

            // AI automation action
            $table->string('action')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
    }
};