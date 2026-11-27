<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('canchas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100);
            $table->string('tamanio', 20);
            $table->string('tipo_piso', 50);
            $table->decimal('precio', 10, 2);
            $table->boolean('disponible')->default(true);
            $table->boolean('activo')->default(true);
            $table->foreignId('complejo_id')->constrained('complejos')->cascadeOnDelete();
            $table->timestamps();

            // Evita repetir nombres de cancha dentro del mismo complejo
            $table->unique(['complejo_id', 'nombre']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('canchas');
    }
};