<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resenias', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('calificacion'); // 1 a 5
            $table->text('comentario')->nullable();
            $table->timestamp('publicado_en')->useCurrent();
            $table->boolean('activo')->default(true);
            $table->foreignId('reserva_id')->unique()->constrained('reservas')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resenias');
    }
};