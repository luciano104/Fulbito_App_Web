<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Cancha extends Model
{
    use HasFactory;

    protected $table = 'canchas';

    public const TIPO_F5 = 'F5';
    public const TIPO_F7 = 'F7';
    public const TIPO_F11 = 'F11';

    public const TIPOS_CANCHA = [
        self::TIPO_F5,
        self::TIPO_F7,
        self::TIPO_F11,
    ];

    protected $fillable = [
        'nombre',
        'tamanio',
        'tipo_piso',
        'precio',
        'disponible',
        'activo',
        'complejo_id',
    ];

    protected $casts = [
        'precio'     => 'decimal:2',
        'disponible' => 'boolean',
        'activo'     => 'boolean',
    ];

    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    public function complejo(): BelongsTo
    {
        return $this->belongsTo(Complejo::class, 'complejo_id');
    }

    public function horarios(): HasMany
    {
        return $this->hasMany(Horario::class, 'cancha_id');
    }

    public function reservas(): HasManyThrough
    {
        return $this->hasManyThrough(
            Reserva::class,
            Horario::class,
            'cancha_id',
            'horario_id',
            'id',
            'id'
        );
    }
}