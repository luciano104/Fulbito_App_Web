<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('horarios', function (Blueprint $table) {
            $table->id();
            $table->time('start_time');
            $table->time('end_time');
            $table->foreignId('cancha_id')->constrained('canchas')->cascadeOnDelete();
            $table->timestamps();

            // Un mismo horario de inicio no puede repetirse en la misma cancha
            $table->unique(['cancha_id', 'start_time']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('horarios');
    }
};