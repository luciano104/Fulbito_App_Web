<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReseniaRequest;
use App\Http\Requests\UpdateReseniaRequest;
use App\Models\Resenia;
use App\Models\Reserva;
use Illuminate\Http\Request;
use Illuminate\Routing\Attributes\Controllers\Middleware;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ReseniaController extends Controller
{
    #[Middleware("permission:listar resenias")]
    public function index(Request $request)
    {
        $user = Auth::user();

        $buscar       = trim($request->input('buscar', ''));
        $calificacion = $request->input('calificacion', '');
        $orden        = $request->input('orden', 'publicado_en');
        $direccion    = $request->input('direccion', 'desc');
        $porPagina    = (int) $request->input('por_pagina', 10);

        $camposPermitidos = ['calificacion', 'publicado_en', 'created_at'];
        if (!in_array($orden, $camposPermitidos, true)) {
            $orden = 'publicado_en';
        }
        if (!in_array($direccion, ['asc', 'desc'], true)) {
            $direccion = 'desc';
        }
        if (!in_array($porPagina, [5, 10, 20, 50], true)) {
            $porPagina = 10;
        }

        $query = Resenia::activos()->with([
            'reserva.jugador:id,name,email',
            'reserva.horario.cancha:id,nombre,tamanio,complejo_id',
            'reserva.horario.cancha.complejo:id,nombre',
        ]);

        // Filtrado por rol
        if ($user->hasAnyRole(['admin', 'empleado'])) {
            $miComplejo = $user->obtenerComplejoGestionado();
            if ($miComplejo && $miComplejo->activo) {
                $query->whereHas('reserva.horario.cancha', fn ($q) => $q->where('complejo_id', $miComplejo->id));
            } else {
                $query->whereRaw('1 = 0');
            }
        } elseif ($user->hasRole('jugador')) {
            $query->whereHas('reserva', fn ($q) => $q->where('jugador_id', $user->id));
        }

        $resenias = $query
            ->when($buscar !== '', function ($q) use ($buscar) {
                $q->where(function ($sub) use ($buscar) {
                    $sub->where('comentario', 'like', "%{$buscar}%")
                        ->orWhereHas('reserva.jugador', fn ($j) => $j->where('name', 'like', "%{$buscar}%"))
                        ->orWhereHas('reserva.horario.cancha.complejo', fn ($c) => $c->where('nombre', 'like', "%{$buscar}%"));
                });
            })
            ->when($calificacion !== '', fn ($q) => $q->where('calificacion', (int) $calificacion))
            ->orderBy($orden, $direccion)
            ->paginate($porPagina)
            ->withQueryString();

        return Inertia::render('Resenias/Index', [
            'resenias' => $resenias,
            'filtros'  => [
                'buscar'       => $buscar,
                'calificacion' => $calificacion,
                'orden'        => $orden,
                'direccion'    => $direccion,
                'por_pagina'   => $porPagina,
            ],
        ]);
    }

    #[Middleware("permission:crear resenias")]
    public function create()
    {
        $user = Auth::user();

        // Solo reservas completadas, con jugador registrado y sin reseña activa
        $reservasQuery = Reserva::with(['jugador:id,name', 'horario.cancha:id,nombre,tamanio,complejo_id', 'horario.cancha.complejo:id,nombre'])
            ->where('estado', Reserva::ESTADO_COMPLETADA)
            ->whereNotNull('jugador_id')
            ->whereDoesntHave('resenia', fn ($q) => $q->where('activo', true))
            ->orderByDesc('fecha');

        if ($user->hasRole('jugador')) {
            $reservasQuery->where('jugador_id', $user->id);
        } elseif ($user->hasAnyRole(['admin', 'empleado'])) {
            $miComplejo = $user->obtenerComplejoGestionado();
            $reservasQuery->whereHas('horario.cancha', fn ($q) => $q->where('complejo_id', $miComplejo?->id ?? 0));
        }

        return Inertia::render('Resenias/Create', [
            'reservas' => $reservasQuery->get(),
        ]);
    }

    #[Middleware("permission:crear resenias")]
    public function store(StoreReseniaRequest $request)
    {
        $validated = $request->validated();
        $validated['publicado_en'] = now();
        $validated['activo'] = true;

        // El evento saved() en Resenia recalcula automáticamente el rating del Complejo
        Resenia::create($validated);

        return redirect()
            ->route('resenias.index')
            ->with('success', 'Reseña publicada correctamente.');
    }

    #[Middleware("permission:ver resenias")]
    public function show(Resenia $resenia)
    {
        $this->autorizarAccesoResenia($resenia);

        $resenia->load([
            'reserva.jugador:id,name,email',
            'reserva.horario.cancha.complejo',
        ]);

        return Inertia::render('Resenias/Show', [
            'resenia' => $resenia,
        ]);
    }

    #[Middleware("permission:editar resenias")]
    public function edit(Resenia $resenia)
    {
        $this->autorizarAccesoResenia($resenia, soloAutorOSuperAdmin: true);

        $resenia->load([
            'reserva.jugador:id,name',
            'reserva.horario.cancha.complejo',
        ]);

        return Inertia::render('Resenias/Edit', [
            'resenia' => $resenia,
        ]);
    }

    #[Middleware("permission:editar resenias")]
    public function update(UpdateReseniaRequest $request, Resenia $resenia)
    {
        $this->autorizarAccesoResenia($resenia, soloAutorOSuperAdmin: true);

        $resenia->update($request->validated());

        return redirect()
            ->route('resenias.index')
            ->with('success', 'Reseña actualizada correctamente.');
    }

    #[Middleware("permission:eliminar resenias")]
    public function destroy(Resenia $resenia)
    {
        $this->autorizarAccesoResenia($resenia);

        // Eliminación lógica (dispara saved() y recalcula el promedio del complejo)
        $resenia->update(['activo' => false]);

        return redirect()
            ->route('resenias.index')
            ->with('success', 'Reseña eliminada correctamente.');
    }

    /**
     * Verifica que la reseña esté activa y que el usuario tenga acceso según su rol.
     */
    private function autorizarAccesoResenia(Resenia $resenia, bool $soloAutorOSuperAdmin = false): void
    {
        abort_unless($resenia->activo, 404);

        $resenia->loadMissing('reserva.horario.cancha');
        $user = Auth::user();

        if ($user->hasRole('jugador')) {
            abort_unless($resenia->reserva?->jugador_id === $user->id, 403);
            return;
        }

        if ($soloAutorOSuperAdmin && !$user->hasRole('superadmin')) {
            abort(403, 'Solo el jugador autor o un superadministrador puede editar el contenido de la reseña.');
        }

        if ($user->hasAnyRole(['admin', 'empleado'])) {
            $miComplejo = $user->obtenerComplejoGestionado();
            abort_unless(
                $miComplejo && $resenia->reserva?->horario?->cancha?->complejo_id === $miComplejo->id,
                403
            );
        }
    }
}