<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Reserva extends Model
{
    use HasFactory;

    protected $table = 'reservas';

    public const ESTADO_PENDIENTE  = 'pendiente';
    public const ESTADO_CONFIRMADA = 'confirmada';
    public const ESTADO_CANCELADA  = 'cancelada';
    public const ESTADO_COMPLETADA = 'completada';

    public const ESTADOS = [
        self::ESTADO_PENDIENTE,
        self::ESTADO_CONFIRMADA,
        self::ESTADO_CANCELADA,
        self::ESTADO_COMPLETADA,
    ];

    protected $fillable = [
        'fecha',
        'estado',
        'precio_historico',
        'jugador_id',
        'nya_jugador',
        'horario_id',
    ];

    protected $casts = [
        'fecha'            => 'date:Y-m-d',
        'precio_historico' => 'float',
    ];

    protected $appends = [
        'cliente_nombre',
    ];

    public function jugador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'jugador_id');
    }

    public function horario(): BelongsTo
    {
        return $this->belongsTo(Horario::class, 'horario_id');
    }

    public function resenia(): HasOne
    {
        return $this->hasOne(Resenia::class, 'reserva_id');
    }

    /**
     * Devuelve el nombre del usuario registrado o el ingresado manualmente por el staff.
     */
    public function getClienteNombreAttribute(): string
    {
        return $this->jugador?->name ?? $this->nya_jugador ?? 'Cliente sin nombre';
    }
}