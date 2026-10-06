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
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();

            // Customer ka original message
            $table->text('customer_message');

            // AI classification
            $table->string('category');
            $table->string('priority');
            $table->string('action');

            // AI ne decision kyun liya
            $table->text('ai_reason')->nullable();

            // Ticket status
            $table->string('status')->default('OPEN');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('support_tickets');
    }
};