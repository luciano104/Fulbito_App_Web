<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Complejo extends Model
{
    use HasFactory;

    protected $table = 'complejos';

    // Constantes equivalentes a Facility en Django
    public const PISO_PASTO = 'pasto';
    public const PISO_SINTETICO = 'sintetico';
    public const PISO_CEMENTO = 'cemento';
    public const PISO_TIERRA = 'tierra';
    public const TIPOS_PISO = [
        self::PISO_TIERRA,
        self::PISO_SINTETICO,
        self::PISO_PASTO,
        self::PISO_CEMENTO,
    ];

    protected $fillable = [
        'nombre',
        'direccion',
        'latitud',
        'longitud',
        'precio_base',
        'tipo_piso',
        'avg_rating',
        'total_reviews',
        'imagen',
        'admin_id',
        'activo'
    ];

    protected $casts = [
        'latitud' => 'float',
        'longitud' => 'float',
        'precio_base' => 'decimal:2',
        'avg_rating' => 'float',
        'total_reviews' => 'integer',
        'activo' => 'boolean'
    ];

    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
    public function empleados(): HasMany
    {
        return $this->hasMany(User::class, 'complejo_id');
    }

    public function canchas(): HasMany
    {
        return $this->hasMany(Cancha::class, 'complejo_id');
    }

    public function favoritos(): HasMany
    {
        return $this->hasMany(Favorito::class, 'complejo_id');
    }

    /**
     * Recalcula el promedio de estrellas y total de reseñas (lógica traída de create_review en Django)
     */
    public function recalcularRating(): void
    {
        $resenias = Resenia::whereHas('reserva.horario.cancha', function ($query) {
            $query->where('complejo_id', $this->id);
        })->get();

        $total = $resenias->count();
        $avg = $total > 0 ? round($resenias->avg('calificacion'), 1) : 0.0;

        $this->update([
            'avg_rating' => $avg,
            'total_reviews' => $total,
        ]);
    }
}