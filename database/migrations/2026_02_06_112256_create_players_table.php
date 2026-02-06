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
        Schema::create('players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained('quiz_rooms')->onDelete('cascade');
            $table->string('name', 100);
            $table->integer('score')->default(0);
            $table->text('current_answer')->nullable();
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();

            $table->index('room_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('players');
    }
};
