<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('favoritos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('jugador_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->foreignId('complejo_id')
                  ->constrained('complejos')
                  ->cascadeOnDelete();
            $table->timestamps();

            // Evita que un jugador marque dos veces el mismo complejo
            $table->unique(['jugador_id', 'complejo_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('favoritos');
    }
};