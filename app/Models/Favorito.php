<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Favorito extends Model
{
    use HasFactory;

    protected $table = 'favoritos';

    protected $fillable = [
        'jugador_id',
        'complejo_id',
    ];

    public function jugador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'jugador_id');
    }

    public function complejo(): BelongsTo
    {
        return $this->belongsTo(Complejo::class, 'complejo_id');
    }
}