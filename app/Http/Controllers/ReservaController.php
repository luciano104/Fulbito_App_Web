<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReservaRequest;
use App\Http\Requests\UpdateReservaRequest;
use App\Models\Horario;
use App\Models\Reserva;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Attributes\Controllers\Middleware;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

use App\Mail\ReservaEstadoMail;
use Illuminate\Support\Facades\Mail;

class ReservaController extends Controller
{
    #[Middleware("permission:listar reservas")]
    public function index(Request $request)
    {
        $user = Auth::user();

        $buscar = trim((string) $request->input('buscar', ''));
        $estado = (string) $request->input('estado', '');
        // Por defecto muestra las reservas de hoy; si viene ?fecha= vacío (al limpiar filtros), muestra todas
        $fecha = $request->has('fecha')
            ? (string) $request->input('fecha', '')
            : now()->toDateString();
        $orden = $request->input('orden', 'fecha');
        $direccion = $request->input('direccion', 'desc');
        $porPagina = (int) $request->input('por_pagina', 10);

        $camposPermitidos = ['fecha', 'estado', 'created_at'];
        if (!in_array($orden, $camposPermitidos, true)) {
            $orden = 'fecha';
        }
        if (!in_array($direccion, ['asc', 'desc'], true)) {
            $direccion = 'desc';
        }
        if (!in_array($porPagina, [5, 10, 20, 50], true)) {
            $porPagina = 10;
        }

        $query = Reserva::with([
            'jugador:id,name,email',
            'horario.cancha:id,nombre,tamanio,tipo_piso,precio,complejo_id',
            'horario.cancha.complejo:id,nombre',
        ]);

        if ($user->hasAnyRole(['admin', 'empleado'])) {
            $miComplejo = $user->obtenerComplejoGestionado();

            if ($miComplejo && $miComplejo->activo) {
                $query->whereHas('horario.cancha', fn($q) => $q->where('complejo_id', $miComplejo->id));
            } else {
                $query->whereRaw('1 = 0');
            }
        } elseif ($user->hasRole('jugador')) {
            $query->where('jugador_id', $user->id);
        }

        $reservas = $query
            ->when($buscar !== '', function ($q) use ($buscar) {
                $q->where(function ($sub) use ($buscar) {
                    $sub->where('nya_jugador', 'like', "%{$buscar}%")
                        ->orWhereHas('jugador', function ($j) use ($buscar) {
                            $j->where('name', 'like', "%{$buscar}%")
                                ->orWhere('email', 'like', "%{$buscar}%");
                        })
                        ->orWhereHas('horario.cancha', fn($c) => $c->where('nombre', 'like', "%{$buscar}%"));
                });
            })
            ->when($estado !== '', fn($q) => $q->where('estado', $estado))
            ->when($fecha !== '', fn($q) => $q->whereDate('fecha', $fecha))
            ->orderBy($orden, $direccion)
            ->paginate($porPagina)
            ->withQueryString();

        return Inertia::render('Reservas/Index', [
            'reservas' => $reservas,
            'estados' => Reserva::ESTADOS,
            'filtros' => [
                'buscar' => $buscar,
                'estado' => $estado,
                'fecha' => $fecha,
                'orden' => $orden,
                'direccion' => $direccion,
                'por_pagina' => $porPagina,
            ],
        ]);
    }

    #[Middleware("permission:crear reservas")]
    public function create()
    {
        $user = Auth::user();

        $horariosQuery = Horario::with('cancha.complejo')
            ->whereHas('cancha', fn($q) => $q->where('activo', true)->where('disponible', true));

        // Filtramos reservas activas desde hoy para bloquear horarios ocupados en el select
        $reservasOcupadasQuery = Reserva::whereDate('fecha', '>=', now()->toDateString())
            ->whereIn('estado', [
                Reserva::ESTADO_PENDIENTE,
                Reserva::ESTADO_CONFIRMADA,
                Reserva::ESTADO_COMPLETADA,
            ]);

        if ($user->hasAnyRole(['admin', 'empleado'])) {
            $complejo = $user->obtenerComplejoGestionado();
            $complejoId = $complejo?->id ?? 0;

            $horariosQuery->whereHas('cancha', fn($q) => $q->where('complejo_id', $complejoId));
            $reservasOcupadasQuery->whereHas('horario.cancha', fn($q) => $q->where('complejo_id', $complejoId));
        }

        $horarios = $horariosQuery->orderBy('cancha_id')->orderBy('start_time')->get();

        // Enviamos únicamente fecha y horario_id para mantener la respuesta liviana
        $reservasOcupadas = $reservasOcupadasQuery->get(['fecha', 'horario_id']);

        $jugadores = $user->hasAnyRole(['super-admin', 'admin', 'empleado'])
            ? User::role('jugador')->select('id', 'name', 'email')->orderBy('name')->get()
            : [];

        return Inertia::render('Reservas/Create', [
            'horarios' => $horarios,
            'reservasOcupadas' => $reservasOcupadas,
            'jugadores' => $jugadores,
            'estados' => [
                Reserva::ESTADO_PENDIENTE,
                Reserva::ESTADO_CONFIRMADA,
            ],
        ]);
    }

    #[Middleware("permission:crear reservas")]
    public function store(StoreReservaRequest $request)
    {
        $user = Auth::user();
        $validated = $request->validated();

        if ($user->hasRole('jugador')) {
            $validated['jugador_id'] = $user->id;
            $validated['nya_jugador'] = null;
        } elseif (!empty($validated['jugador_id'])) {
            // Si seleccionó un jugador registrado, limpiamos el campo manual
            $validated['nya_jugador'] = null;
        } else {
            // Si es reserva presencial con nya_jugador, aseguramos jugador_id en null
            $validated['jugador_id'] = null;
        }

        // Congelamos el precio actual de la cancha en precio_historico
        $horario = Horario::with('cancha')->findOrFail($validated['horario_id']);
        $validated['precio_historico'] = $horario->cancha?->precio ?? 0;

        $reserva = Reserva::create($validated);

        // Envía correo al jugador registrado sin importar si se creó como pendiente o confirmada
        $this->notificarEstadoJugador($reserva);

        return redirect()
            ->route('reservas.index')
            ->with('success', 'Reserva creada correctamente.');
    }
    #[Middleware("permission:ver reservas")]
    public function show(Reserva $reserva)
    {
        $this->autorizarAccesoReserva($reserva);

        $reserva->load([
            'jugador',
            'horario.cancha.complejo',
            'resenia' => fn($q) => $q->where('activo', true),
        ]);

        return Inertia::render('Reservas/Show', [
            'reserva' => $reserva,
        ]);
    }

    #[Middleware("permission:editar reservas")]
    public function edit(Reserva $reserva)
    {
        $this->autorizarAccesoReserva($reserva);

        if (in_array($reserva->estado, [Reserva::ESTADO_COMPLETADA, Reserva::ESTADO_CANCELADA], true)) {
            return redirect()
                ->route('reservas.show', $reserva)
                ->with('error', "Una reserva {$reserva->estado} no puede cambiar de estado.");
        }

        $transicionesPermitidas = match ($reserva->estado) {
            Reserva::ESTADO_PENDIENTE => [Reserva::ESTADO_CONFIRMADA, Reserva::ESTADO_CANCELADA],
            Reserva::ESTADO_CONFIRMADA => [Reserva::ESTADO_CANCELADA, Reserva::ESTADO_COMPLETADA],
            default => [],
        };

        $reserva->load(['jugador', 'horario.cancha']);

        return Inertia::render('Reservas/Edit', [
            'reserva' => $reserva,
            'estados' => $transicionesPermitidas,
        ]);
    }

    #[Middleware("permission:editar reservas")]
    public function update(UpdateReservaRequest $request, Reserva $reserva)
    {
        $this->autorizarAccesoReserva($reserva);

        $estadoAnterior = $reserva->estado;
        $nuevoEstado = $request->validated()['estado'];

        $reserva->update([
            'estado' => $nuevoEstado,
        ]);

        // Enviar correo solo si cambió de estado a confirmada o cancelada y tiene jugador con email
        if (
            $estadoAnterior !== $nuevoEstado &&
            in_array($nuevoEstado, [Reserva::ESTADO_CONFIRMADA, Reserva::ESTADO_CANCELADA], true)
        ) {
            $this->notificarEstadoJugador($reserva);
        }

        return redirect()
            ->route('reservas.index')
            ->with('success', 'Estado de la reserva actualizado correctamente.');
    }

    #[Middleware("permission:eliminar reservas")]
    public function destroy(Reserva $reserva)
    {
        $this->autorizarAccesoReserva($reserva);

        $reserva->delete();

        return redirect()
            ->route('reservas.index')
            ->with('success', 'Reserva eliminada correctamente.');
    }

    /**
     * Obtiene los horarios de canchas activas y disponibles según el rol del usuario.
     */
    private function obtenerHorariosDisponibles($user)
    {
        $query = Horario::with(['cancha:id,nombre,tamanio,tipo_piso,precio,complejo_id', 'cancha.complejo:id,nombre'])
            ->whereHas('cancha', fn($q) => $q->where('activo', true)->where('disponible', true))
            ->orderBy('start_time');

        if ($user->hasAnyRole(['admin', 'empleado'])) {
            $miComplejo = $user->obtenerComplejoGestionado();
            if ($miComplejo && $miComplejo->activo) {
                $query->whereHas('cancha', fn($q) => $q->where('complejo_id', $miComplejo->id));
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        return $query->get();
    }

    /**
     * Verifica que la reserva pertenezca al complejo del admin/empleado o al jugador en sesión.
     */
    private function autorizarAccesoReserva(Reserva $reserva): void
    {
        $reserva->loadMissing('horario.cancha');
        $user = Auth::user();

        if ($user->hasAnyRole(['admin', 'empleado'])) {
            $miComplejo = $user->obtenerComplejoGestionado();
            abort_unless(
                $miComplejo && $reserva->horario?->cancha?->complejo_id === $miComplejo->id,
                403
            );
        } elseif ($user->hasRole('jugador')) {
            abort_unless($reserva->jugador_id === $user->id, 403);
        }
    }

    /**
     * Envía un correo al jugador registrado cuando su reserva es confirmada o cancelada.
     */
    private function notificarEstadoJugador(Reserva $reserva): void
    {
        $reserva->loadMissing(['jugador', 'horario.cancha.complejo']);

        if (!$reserva->jugador || empty($reserva->jugador->email)) {
            return;
        }

        $horarioTexto = $reserva->horario
            ? substr($reserva->horario->start_time, 0, 5) . ' - ' . substr($reserva->horario->end_time, 0, 5)
            : 'N/A';

        $data = [
            'reserva_id' => str_pad((string) $reserva->id, 6, '0', STR_PAD_LEFT),
            'estado' => $reserva->estado,
            'jugador_nombre' => $reserva->jugador->name,
            'complejo_nombre' => $reserva->horario?->cancha?->complejo?->nombre ?? 'Complejo Deportivo',
            'cancha_nombre' => $reserva->horario?->cancha?->nombre ?? 'Cancha asignada',
            'fecha' => $reserva->fecha->format('d/m/Y'),
            'horario' => $horarioTexto,
        ];

        Mail::to($reserva->jugador->email)->send(new ReservaEstadoMail($data));
    }
}