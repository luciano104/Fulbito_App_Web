<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('complejos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('direccion');
            $table->decimal('latitud', 10, 8);
            $table->decimal('longitud', 11, 8);
            $table->decimal('precio_base', 10, 2);
            $table->string('tipo_piso');
            $table->decimal('avg_rating', 3, 2)->default(0);
            $table->integer('total_reviews')->default(0);
            $table->string('imagen')->nullable();
            $table->foreignId('admin_id')->constrained('users')->cascadeOnDelete();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('complejos');
    }
};
