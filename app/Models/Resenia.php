<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Resenia extends Model
{
    use HasFactory;

    protected $table = 'resenias';

    protected $fillable = [
        'calificacion',
        'comentario',
        'publicado_en',
        'activo',
        'reserva_id',
    ];

    protected $casts = [
        'calificacion' => 'integer',
        'publicado_en' => 'datetime',
        'activo'       => 'boolean',
    ];

    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    public function reserva(): BelongsTo
    {
        return $this->belongsTo(Reserva::class, 'reserva_id');
    }

    /**
     * Recalcula automáticamente el rating del complejo al guardar o desactivar una reseña.
     */
    protected static function booted(): void
    {
        static::saved(function (Resenia $resenia) {
            $complejo = $resenia->reserva?->horario?->cancha?->complejo;
            $complejo?->recalcularRating();
        });
    }
}