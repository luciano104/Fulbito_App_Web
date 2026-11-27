<?php

namespace App\Http\Controllers;

use App\Models\Cancha;
use App\Models\Complejo;
use App\Models\Horario;
use App\Models\Reserva;
use App\Models\Resenia;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = Auth::user();

        // Validación de coherencia de fechas si ambas están presentes
        if ($request->filled('fecha_inicio') && $request->filled('fecha_fin')) {
            $request->validate([
                'fecha_inicio' => ['date'],
                'fecha_fin'    => ['date', 'after_or_equal:fecha_inicio'],
            ], [
                'fecha_fin.after_or_equal' => 'La fecha fin no puede ser anterior a la fecha inicio.',
            ]);
        }

        // ==========================================
        // 1. DASHBOARD SUPERADMIN (Gestión SaaS)
        // ==========================================
        if ($user->hasRole('super-admin')) {
            $filtroComplejoId = (string) $request->input('complejo_id', '');
            $filtroEstado     = (string) $request->input('estado', '');
            $fechaInicio      = (string) $request->input('fecha_inicio', '');
            $fechaFin         = (string) $request->input('fecha_fin', '');

            $complejosQuery = Complejo::with('admin:id,name,email');

            if ($filtroComplejoId !== '') {
                $complejosQuery->where('id', $filtroComplejoId);
            }
            if ($filtroEstado === 'activos') {
                $complejosQuery->where('activo', true);
            } elseif ($filtroEstado === 'inactivos') {
                $complejosQuery->where('activo', false);
            }
            if ($fechaInicio !== '') {
                $complejosQuery->whereDate('created_at', '>=', $fechaInicio);
            }
            if ($fechaFin !== '') {
                $complejosQuery->whereDate('created_at', '<=', $fechaFin);
            }

            $complejos = $complejosQuery->orderBy('created_at', 'desc')->get();
            $todosLosComplejos = Complejo::select('id', 'nombre')->orderBy('nombre')->get();

            $usuariosStaff = User::role(['admin', 'empleado'])
                ->with(['roles:id,name', 'complejo:id,nombre', 'complejoAdministrado:id,nombre,admin_id'])
                ->get()
                ->map(fn ($u) => [
                    'id'       => $u->id,
                    'name'     => $u->name,
                    'email'    => $u->email,
                    'rol'      => $u->roles->first()?->name ?? 'sin rol',
                    'complejo' => $u->hasRole('admin')
                        ? ($u->complejoAdministrado?->nombre ?? 'Sin asignar')
                        : ($u->complejo?->nombre ?? 'Sin asignar'),
                ]);

            $pagosSuscripcionHardcoded = collect([
                ['id' => 101, 'complejo_id' => 1, 'complejo' => 'Complejo La Red', 'plan' => 'Pro Anual', 'monto' => 45000, 'fecha_pago' => '2026-11-01', 'estado_pago' => 'pagado', 'metodo' => 'Transferencia'],
                ['id' => 102, 'complejo_id' => 2, 'complejo' => 'Fútbol 5 El Potrero', 'plan' => 'Mensual Básico', 'monto' => 18000, 'fecha_pago' => '2026-11-05', 'estado_pago' => 'pagado', 'metodo' => 'MercadoPago'],
                ['id' => 103, 'complejo_id' => 3, 'complejo' => 'Arena Gol Salta', 'plan' => 'Pro Mensual', 'monto' => 25000, 'fecha_pago' => '2026-11-10', 'estado_pago' => 'pendiente', 'metodo' => 'Transferencia'],
                ['id' => 104, 'complejo_id' => 1, 'complejo' => 'Complejo La Red', 'plan' => 'Pro Anual', 'monto' => 45000, 'fecha_pago' => '2026-10-01', 'estado_pago' => 'pagado', 'metodo' => 'Transferencia'],
                ['id' => 105, 'complejo_id' => 4, 'complejo' => 'Canchas Norte', 'plan' => 'Mensual Básico', 'monto' => 18000, 'fecha_pago' => '2026-10-15', 'estado_pago' => 'vencido', 'metodo' => 'Débito Automático'],
            ])->filter(function ($pago) use ($filtroComplejoId, $fechaInicio, $fechaFin) {
                if ($filtroComplejoId !== '' && $pago['complejo_id'] != $filtroComplejoId) {
                    return false;
                }
                if ($fechaInicio !== '' && $pago['fecha_pago'] < $fechaInicio) {
                    return false;
                }
                if ($fechaFin !== '' && $pago['fecha_pago'] > $fechaFin) {
                    return false;
                }
                return true;
            })->values();

            $metricsSuperadmin = [
                'total_complejos'     => Complejo::count(),
                'complejos_activos'   => Complejo::where('activo', true)->count(),
                'complejos_inactivos' => Complejo::where('activo', false)->count(),
                'ingresos_saas_mes'   => $pagosSuscripcionHardcoded->where('estado_pago', 'pagado')->sum('monto'),
            ];

            return Inertia::render('Dashboards/SuperAdminDashboard', [
                'metrics'           => $metricsSuperadmin,
                'complejos'         => $complejos,
                'todosLosComplejos' => $todosLosComplejos,
                'usuariosStaff'     => $usuariosStaff,
                'pagosSuscripcion'  => $pagosSuscripcionHardcoded,
                'filters'           => [
                    'complejo_id'  => $filtroComplejoId,
                    'estado'       => $filtroEstado,
                    'fecha_inicio' => $fechaInicio,
                    'fecha_fin'    => $fechaFin,
                ],
            ]);
        }

        // ==========================================
        // 2. DASHBOARD DUEÑO DEL COMPLEJO
        // ==========================================
        if ($user->hasRole('admin') || $user->can('ver dashboard duenio')) {
            $complejo = Complejo::where('admin_id', $user->id)->first();

            if (!$complejo) {
                return Inertia::render('Dashboards/DuenioDashboard', [
                    'complejo'            => null,
                    'metrics'             => ['total_recaudado' => 0, 'total_canchas' => 0, 'total_reservas' => 0, 'porcentaje_ocupacion' => 0, 'promedio_resenia' => 0],
                    'ingresosMensuales'   => [],
                    'distribucionEstados' => [],
                    'canchas'             => [],
                    'horariosDisponibles' => [],
                    'reservasFiltradas'   => [],
                    'reseniasFiltradas'   => [],
                    'filters'             => [],
                ]);
            }

            // Si no se envían fechas, mostramos TODOS los registros históricos
            $fechaInicio   = trim((string) $request->input('fecha_inicio', ''));
            $fechaFin      = trim((string) $request->input('fecha_fin', ''));
            $canchaId      = (string) $request->input('cancha_id', '');
            $horarioInicio = (string) $request->input('horario_inicio', '');
            $estadoReserva = (string) $request->input('estado', '');
            $tipoResenia   = (string) $request->input('tipo_resenia', '');

            $canchas = Cancha::where('complejo_id', $complejo->id)
                ->where('activo', true)
                ->withCount('reservas')
                ->get();

            $horariosDisponibles = Horario::whereIn('cancha_id', $canchas->pluck('id'))
                ->select('start_time', 'end_time')
                ->distinct()
                ->orderBy('start_time')
                ->get();

            // Query base de reservas filtrada (sin fechas = trae todo el historial)
            $reservasQuery = Reserva::whereHas('horario.cancha', function ($q) use ($complejo, $canchaId) {
                $q->where('complejo_id', $complejo->id)->where('activo', true);
                if ($canchaId !== '') {
                    $q->where('id', $canchaId);
                }
            })
                ->when($fechaInicio !== '', fn ($q) => $q->whereDate('fecha', '>=', $fechaInicio))
                ->when($fechaFin !== '', fn ($q) => $q->whereDate('fecha', '<=', $fechaFin))
                ->when($horarioInicio !== '', function ($q) use ($horarioInicio) {
                    $q->whereHas('horario', fn ($h) => $h->where('start_time', $horarioInicio));
                })
                ->when($estadoReserva !== '', fn ($q) => $q->where('estado', $estadoReserva))
                ->when($tipoResenia === 'positivas', function ($q) {
                    $q->whereHas('resenia', fn ($r) => $r->where('activo', true)->where('calificacion', '>=', 4));
                })
                ->when($tipoResenia === 'negativas', function ($q) {
                    $q->whereHas('resenia', fn ($r) => $r->where('activo', true)->where('calificacion', '<=', 3));
                });

            // Recaudación usando precio_historico congelado al momento de la reserva
            $totalRecaudado = (clone $reservasQuery)
                ->whereIn('reservas.estado', ['confirmada', 'completada'])
                ->join('horarios', 'reservas.horario_id', '=', 'horarios.id')
                ->join('canchas', 'horarios.cancha_id', '=', 'canchas.id')
                ->sum(DB::raw('COALESCE(NULLIF(reservas.precio_historico, 0), canchas.precio)'));

            $totalReservas = (clone $reservasQuery)->count();

            // Cálculo de días del período para ocupación y agrupación del gráfico
            if ($fechaInicio !== '' && $fechaFin !== '') {
                $inicioCalculo = Carbon::parse($fechaInicio);
                $finCalculo    = Carbon::parse($fechaFin);
            } else {
                $minFecha = (clone $reservasQuery)->min('fecha');
                $maxFecha = (clone $reservasQuery)->max('fecha');
                $inicioCalculo = $minFecha ? Carbon::parse($minFecha) : Carbon::now();
                $finCalculo    = $maxFecha ? Carbon::parse($maxFecha) : Carbon::now();
            }

            $diasRango = max(1, $inicioCalculo->diffInDays($finCalculo) + 1);
            $turnosDiariosPosibles = Horario::whereHas('cancha', function ($q) use ($complejo, $canchaId) {
                $q->where('complejo_id', $complejo->id)->where('activo', true);
                if ($canchaId !== '') {
                    $q->where('id', $canchaId);
                }
            })->when($horarioInicio !== '', fn ($q) => $q->where('start_time', $horarioInicio))->count();

            $capacidadTotalPeriodo  = $turnosDiariosPosibles * $diasRango;
            $reservasActivasPeriodo = (clone $reservasQuery)->whereIn('estado', ['confirmada', 'completada', 'pendiente'])->count();

            $porcentajeOcupacion = $capacidadTotalPeriodo > 0
                ? min(100, round(($reservasActivasPeriodo / $capacidadTotalPeriodo) * 100, 1))
                : 0;

            // Reseñas dentro del filtro
            $reseniasQuery = Resenia::where('activo', true)
                ->whereHas('reserva', function ($q) use ($complejo, $fechaInicio, $fechaFin, $canchaId, $horarioInicio) {
                    $q->when($fechaInicio !== '', fn ($sub) => $sub->whereDate('fecha', '>=', $fechaInicio))
                      ->when($fechaFin !== '', fn ($sub) => $sub->whereDate('fecha', '<=', $fechaFin))
                      ->whereHas('horario.cancha', function ($c) use ($complejo, $canchaId) {
                          $c->where('complejo_id', $complejo->id);
                          if ($canchaId !== '') {
                              $c->where('id', $canchaId);
                          }
                      });
                    if ($horarioInicio !== '') {
                        $q->whereHas('horario', fn ($h) => $h->where('start_time', $horarioInicio));
                    }
                })
                ->when($tipoResenia === 'positivas', fn ($q) => $q->where('calificacion', '>=', 4))
                ->when($tipoResenia === 'negativas', fn ($q) => $q->where('calificacion', '<=', 3));

            $promedioResenia = round((clone $reseniasQuery)->avg('calificacion') ?? 0, 1);

            // Gráfico 1: Ingresos agrupados por día o mes usando precio_historico
            $formatoAgrupacion = $diasRango <= 31 ? '%d/%m' : '%b %Y';
            $formatoOrden      = $diasRango <= 31 ? '%Y-%m-%d' : '%Y-%m';

            $ingresosMensuales = (clone $reservasQuery)
                ->whereIn('reservas.estado', ['confirmada', 'completada'])
                ->join('horarios', 'reservas.horario_id', '=', 'horarios.id')
                ->join('canchas', 'horarios.cancha_id', '=', 'canchas.id')
                ->select(
                    DB::raw("DATE_FORMAT(fecha, '{$formatoOrden}') as periodo_key"),
                    DB::raw("DATE_FORMAT(fecha, '{$formatoAgrupacion}') as mes"),
                    DB::raw("SUM(COALESCE(NULLIF(reservas.precio_historico, 0), canchas.precio)) as monto")
                )
                ->groupBy('periodo_key', 'mes')
                ->orderBy('periodo_key', 'asc')
                ->get()
                ->map(fn ($item) => [
                    'mes'   => $item->mes,
                    'monto' => (float) $item->monto,
                ]);

            // Gráfico 2: Distribución por Estado con COLOR FIJO GARANTIZADO
            $coloresPorEstado = [
                'confirmada' => '#10b981', // Verde
                'completada' => '#3b82f6', // Azul
                'pendiente'  => '#eab308', // Amarillo
                'cancelada'  => '#ef4444', // Rojo
            ];

            $distribucionEstados = (clone $reservasQuery)
                ->select('estado', DB::raw('count(*) as total'))
                ->groupBy('estado')
                ->get()
                ->map(function ($item) use ($coloresPorEstado) {
                    $est = strtolower($item->estado);
                    return [
                        'name'  => ucfirst($est),
                        'value' => (int) $item->total,
                        'fill'  => $coloresPorEstado[$est] ?? '#64748b',
                    ];
                });

            $reservasFiltradas = (clone $reservasQuery)
                ->with(['jugador:id,name,email', 'horario.cancha', 'resenia'])
                ->orderBy('fecha', 'desc')
                ->take(15)
                ->get();

            $reseniasFiltradas = (clone $reseniasQuery)
                ->with(['reserva.jugador:id,name', 'reserva.horario.cancha:id,nombre'])
                ->latest('publicado_en')
                ->take(8)
                ->get();

            return Inertia::render('Dashboards/DuenioDashboard', [
                'complejo' => [
                    'id'        => $complejo->id,
                    'nombre'    => $complejo->nombre,
                    'direccion' => $complejo->direccion ?? '',
                ],
                'metrics' => [
                    'total_recaudado'      => (float) $totalRecaudado,
                    'total_canchas'        => $canchas->count(),
                    'total_reservas'       => $totalReservas,
                    'porcentaje_ocupacion' => $porcentajeOcupacion,
                    'promedio_resenia'     => $promedioResenia,
                ],
                'ingresosMensuales'   => $ingresosMensuales,
                'distribucionEstados' => $distribucionEstados,
                'canchas'             => $canchas,
                'horariosDisponibles' => $horariosDisponibles,
                'reservasFiltradas'   => $reservasFiltradas,
                'reseniasFiltradas'   => $reseniasFiltradas,
                'filters'             => [
                    'fecha_inicio'   => $fechaInicio,
                    'fecha_fin'      => $fechaFin,
                    'cancha_id'      => $canchaId,
                    'horario_inicio' => $horarioInicio,
                    'estado'         => $estadoReserva,
                    'tipo_resenia'   => $tipoResenia,
                ],
            ]);
        }

        // ==========================================
        // 3. DASHBOARD EMPLEADO (Cierre de Caja Diario)
        // ==========================================
        $fechaHoy = date('Y-m-d');
        $complejoEmpleado = $user->complejo_id ? Complejo::find($user->complejo_id) : null;

        if (!$complejoEmpleado) {
            return Inertia::render('Dashboards/EmpleadoDashboard', [
                'complejo'   => null,
                'fechaHoy'   => $fechaHoy,
                'metricsHoy' => [
                    'total_reservas_hoy'        => 0,
                    'confirmadas_hoy'           => 0,
                    'pendientes_hoy'            => 0,
                    'canceladas_hoy'            => 0,
                    'recaudacion_cobrada_hoy'   => 0,
                    'monto_pendiente_cobro'     => 0,
                    'promedio_diario_historico' => 0,
                    'ocupacion_hoy_porcentaje'  => 0,
                ],
                'resumenPorCancha' => [],
                'ocupacionPorHora' => [],
                'reservasHoy'      => [],
            ]);
        }

        $horariosIdsEmpleado = Horario::whereHas('cancha', function ($q) use ($complejoEmpleado) {
            $q->where('complejo_id', $complejoEmpleado->id)->where('activo', true);
        })->pluck('id');

        $reservasHoy = Reserva::whereDate('fecha', $fechaHoy)
            ->whereIn('horario_id', $horariosIdsEmpleado)
            ->with(['jugador:id,name,email', 'horario.cancha'])
            ->get()
            ->sortBy(fn ($r) => $r->horario?->start_time)
            ->values();

        $confirmadasHoy = $reservasHoy->whereIn('estado', ['confirmada', 'completada'])->count();
        $pendientesHoy  = $reservasHoy->where('estado', 'pendiente')->count();
        $canceladasHoy  = $reservasHoy->where('estado', 'cancelada')->count();

        // Usando precio_historico (con respaldo al precio de cancha si es 0)
        $obtenerPrecioReserva = fn ($r) => ($r->precio_historico > 0)
            ? $r->precio_historico
            : ($r->horario?->cancha?->precio ?? 0);

        $recaudacionCobradaHoy = $reservasHoy->whereIn('estado', ['confirmada', 'completada'])
            ->sum($obtenerPrecioReserva);

        $montoPendienteCobro = $reservasHoy->where('estado', 'pendiente')
            ->sum($obtenerPrecioReserva);

        $recaudacionUltimos30 = Reserva::whereIn('reservas.horario_id', $horariosIdsEmpleado)
            ->whereIn('reservas.estado', ['confirmada', 'completada'])
            ->whereBetween('fecha', [Carbon::now()->subDays(30)->toDateString(), Carbon::yesterday()->toDateString()])
            ->join('horarios', 'reservas.horario_id', '=', 'horarios.id')
            ->join('canchas', 'horarios.cancha_id', '=', 'canchas.id')
            ->sum(DB::raw('COALESCE(NULLIF(reservas.precio_historico, 0), canchas.precio)'));

        $promedioDiarioHistorico = round($recaudacionUltimos30 / 30, 0);

        $turnosOcupadosHoy = $reservasHoy->whereIn('estado', ['confirmada', 'completada', 'pendiente'])->count();
        $ocupacionHoyPorcentaje = $horariosIdsEmpleado->count() > 0
            ? round(($turnosOcupadosHoy / $horariosIdsEmpleado->count()) * 100, 1)
            : 0;

        $resumenPorCancha = Cancha::where('complejo_id', $complejoEmpleado->id)
            ->where('activo', true)
            ->get()
            ->map(function ($cancha) use ($reservasHoy, $obtenerPrecioReserva) {
                $resCancha = $reservasHoy->filter(fn ($r) => $r->horario?->cancha_id === $cancha->id);
                return [
                    'id'                 => $cancha->id,
                    'nombre'             => $cancha->nombre,
                    'tamanio'            => $cancha->tamanio,
                    'turnos_cobrados'    => $resCancha->whereIn('estado', ['confirmada', 'completada'])->count(),
                    'turnos_pendientes'  => $resCancha->where('estado', 'pendiente')->count(),
                    'subtotal_cobrado'   => (float) $resCancha->whereIn('estado', ['confirmada', 'completada'])->sum($obtenerPrecioReserva),
                    'subtotal_pendiente' => (float) $resCancha->where('estado', 'pendiente')->sum($obtenerPrecioReserva),
                ];
            });

        $ocupacionPorHora = Reserva::whereDate('fecha', $fechaHoy)
            ->whereIn('reservas.horario_id', $horariosIdsEmpleado)
            ->where('reservas.estado', '!=', 'cancelada')
            ->join('horarios', 'reservas.horario_id', '=', 'horarios.id')
            ->select('horarios.start_time as hora', DB::raw('count(*) as reservas'))
            ->groupBy('horarios.start_time')
            ->orderBy('horarios.start_time', 'asc')
            ->get();

        return Inertia::render('Dashboards/EmpleadoDashboard', [
            'complejo' => [
                'id'     => $complejoEmpleado->id,
                'nombre' => $complejoEmpleado->nombre,
            ],
            'fechaHoy'   => $fechaHoy,
            'metricsHoy' => [
                'total_reservas_hoy'        => $reservasHoy->count(),
                'confirmadas_hoy'           => $confirmadasHoy,
                'pendientes_hoy'            => $pendientesHoy,
                'canceladas_hoy'            => $canceladasHoy,
                'recaudacion_cobrada_hoy'   => (float) $recaudacionCobradaHoy,
                'monto_pendiente_cobro'     => (float) $montoPendienteCobro,
                'promedio_diario_historico' => (float) $promedioDiarioHistorico,
                'ocupacion_hoy_porcentaje'  => $ocupacionHoyPorcentaje,
            ],
            'resumenPorCancha' => $resumenPorCancha,
            'ocupacionPorHora' => $ocupacionPorHora,
            'reservasHoy'      => $reservasHoy,
        ]);
    }
}