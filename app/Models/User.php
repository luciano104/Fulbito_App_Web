<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property int|null $complejo_id
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'complejo_id'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    // Empleado -> pertenece a un único complejo (users.complejo_id)
    public function complejo(): BelongsTo
    {
        return $this->belongsTo(Complejo::class, 'complejo_id');
    }

    // Admin (Dueño) -> posee un único complejo (complejos.admin_id)
    public function complejoAdministrado(): HasOne
    {
        return $this->hasOne(Complejo::class, 'admin_id');
    }

    // Jugador -> sus reservas
    public function reservas(): HasMany
    {
        return $this->hasMany(Reserva::class, 'jugador_id');
    }

    // Jugador -> sus complejos favoritos
    public function favoritos(): HasMany
    {
        return $this->hasMany(Favorito::class, 'jugador_id');
    }

    /**
     * Devuelve el complejo activo del Admin o Empleado en sesión.
     * El super-admin devuelve null porque no pertenece a ningún complejo.
     */
    public function obtenerComplejoGestionado(): ?Complejo
    {
        if ($this->hasRole('admin')) {
            return $this->complejoAdministrado()->where('activo', true)->first();
        }

        if ($this->hasRole('empleado')) {
            return $this->complejo()->where('activo', true)->first();
        }

        return null;
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'complejo_id'       => 'integer',
        ];
    }
}