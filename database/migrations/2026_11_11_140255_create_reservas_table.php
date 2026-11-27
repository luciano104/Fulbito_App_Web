<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservas', function (Blueprint $table) {
            $table->id();
            $table->date('fecha');
            $table->string('estado', 50)->default('pendiente'); // pendiente, confirmada, cancelada, completada
            $table->decimal('precio_historico', 10, 2);
            $table->foreignId('jugador_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('nya_jugador', 150)->nullable();
            $table->foreignId('horario_id')->constrained('horarios')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservas');
    }
};