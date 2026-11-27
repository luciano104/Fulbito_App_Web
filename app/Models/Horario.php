<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Horario extends Model
{
    use HasFactory;

    protected $table = 'horarios';

    protected $fillable = [
        'start_time',
        'end_time',
        'cancha_id',
    ];

    public function cancha(): BelongsTo
    {
        return $this->belongsTo(Cancha::class, 'cancha_id');
    }

    public function reservas(): HasMany
    {
        return $this->hasMany(Reserva::class, 'horario_id');
    }
}