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
        Schema::create('quiz_rooms', function (Blueprint $table) {
            $table->id();
            $table->string('room_code', 8)->unique();
            $table->enum('status', ['waiting', 'in_progress', 'finished'])->default('waiting');
            $table->json('current_question')->nullable();
            $table->timestamps();

            $table->index('room_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_rooms');
    }
};
