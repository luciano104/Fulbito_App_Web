<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreHorarioRequest;
use App\Models\Cancha;
use App\Models\Horario;
use App\Models\Reserva;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Routing\Attributes\Controllers\Middleware;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HorarioController extends Controller
{
    #[Middleware("permission:listar horarios")]
    #[Middleware("permission:listar horarios")]
    public function index(Request $request)
    {
        $user = Auth::user();

        $fecha = (string) $request->input('fecha', now()->toDateString());

        try {
            $fechaCarbon = Carbon::parse($fecha);
            $fecha = $fechaCarbon->toDateString();
        } catch (\Exception $e) {
            $fechaCarbon = now();
            $fecha = $fechaCarbon->toDateString();
        }

        // Canchas activas del complejo (o todas si es super-admin)
        $canchas = $this->obtenerCanchasPermitidas($user);

        // Todos los horarios base de esas canchas
        $horarios = Horario::whereIn('cancha_id', $canchas->pluck('id'))
            ->orderBy('start_time')
            ->get(['id', 'cancha_id', 'start_time', 'end_time']);

        // Reservas activas (no canceladas) de la fecha consultada para determinar el estado
        $reservasDelDia = Reserva::whereDate('fecha', $fecha)
            ->whereIn('horario_id', $horarios->pluck('id'))
            ->where('estado', '!=', Reserva::ESTADO_CANCELADA)
            ->get(['horario_id', 'estado'])
            ->keyBy('horario_id');

        $canchasColumnas = $canchas->values();

        // Filas únicas ordenadas por hora de inicio
        $franjas = $horarios
            ->map(fn($h) => [
                'start_time' => substr($h->start_time, 0, 5),
                'end_time' => substr($h->end_time, 0, 5),
            ])
            ->unique('start_time')
            ->values();

        $ahora = now();
        $esHoy = $fechaCarbon->isToday();
        $esPasado = $fechaCarbon->isBefore(now()->startOfDay());

        $filas = $franjas->map(function ($franja) use ($canchasColumnas, $horarios, $reservasDelDia, $esHoy, $esPasado, $ahora) {
            $celdas = $canchasColumnas->map(function ($cancha) use ($franja, $horarios, $reservasDelDia, $esHoy, $esPasado, $ahora) {
                $horario = $horarios->first(function ($h) use ($cancha, $franja) {
                    return $h->cancha_id === $cancha->id && substr($h->start_time, 0, 5) === $franja['start_time'];
                });

                if (!$horario) {
                    return [
                        'horario_id' => null,
                        'cancha_id' => $cancha->id,
                        'estado' => 'no_configurado',
                    ];
                }

                $reserva = $reservasDelDia->get($horario->id);
                $horaPasada = $esPasado || ($esHoy && $franja['end_time'] <= $ahora->format('H:i'));

                if (!$cancha->disponible) {
                    $estado = 'mantenimiento';
                } elseif ($reserva) {
                    $estado = ($reserva->estado === Reserva::ESTADO_COMPLETADA || $horaPasada)
                        ? 'completado'
                        : 'reservado';
                } elseif ($horaPasada) {
                    $estado = 'finalizado';
                } else {
                    $estado = 'libre';
                }

                return [
                    'horario_id' => $horario->id,
                    'cancha_id' => $cancha->id,
                    'estado' => $estado,
                ];
            });

            return [
                'hora' => $franja['start_time'],
                'rango' => "{$franja['start_time']} - {$franja['end_time']}",
                'celdas' => $celdas,
            ];
        });

        return Inertia::render('Horarios/Index', [
            'canchasColumnas' => $canchasColumnas,
            'filas' => $filas,
            'totalHorarios' => $horarios->count(),
            'filtros' => [
                'fecha' => $fecha,
            ],
        ]);
    }

    #[Middleware("permission:crear horarios")]
    public function create()
    {
        $user = Auth::user();
        abort_if($user->hasRole('empleado'), 403);

        return Inertia::render('Horarios/Create', [
            'canchas' => $this->obtenerCanchasPermitidas($user),
        ]);
    }

    #[Middleware("permission:crear horarios")]
    public function store(StoreHorarioRequest $request)
    {
        $user = Auth::user();
        abort_if($user->hasRole('empleado'), 403);

        Horario::create($request->validated());

        return redirect()
            ->route('horarios.index')
            ->with('success', 'Horario base creado correctamente.');
    }

    #[Middleware("permission:eliminar horarios")]
    public function destroy(Horario $horario)
    {
        $user = Auth::user();
        abort_if($user->hasRole('empleado'), 403);

        $horario->loadMissing('cancha');
        abort_unless($horario->cancha && $horario->cancha->activo, 404);

        if ($user->hasRole('admin')) {
            $miComplejo = $user->obtenerComplejoGestionado();
            abort_unless($miComplejo && $horario->cancha->complejo_id === $miComplejo->id, 403);
        }

        $tieneReservasFuturas = Reserva::where('horario_id', $horario->id)
            ->whereDate('fecha', '>=', now()->toDateString())
            ->whereIn('estado', [Reserva::ESTADO_PENDIENTE, Reserva::ESTADO_CONFIRMADA])
            ->exists();

        if ($tieneReservasFuturas) {
            return redirect()
                ->route('horarios.index')
                ->with('error', 'No se puede eliminar el horario porque tiene reservas activas a futuro.');
        }

        $horario->delete();

        return redirect()
            ->route('horarios.index')
            ->with('success', 'Horario base eliminado correctamente.');
    }

    private function obtenerCanchasPermitidas($user)
    {
        $query = Cancha::activos()->orderBy('nombre');

        if ($user->hasAnyRole(['admin', 'empleado'])) {
            $miComplejo = $user->obtenerComplejoGestionado();
            if ($miComplejo && $miComplejo->activo) {
                $query->where('complejo_id', $miComplejo->id);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        return $query->get(['id', 'nombre', 'tamanio', 'tipo_piso', 'disponible']);
    }
}