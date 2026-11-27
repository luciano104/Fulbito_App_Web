<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCanchaRequest;
use App\Http\Requests\UpdateCanchaRequest;
use App\Models\Cancha;
use App\Models\Horario;
use App\Models\Reserva;
use Illuminate\Http\Request;
use Illuminate\Routing\Attributes\Controllers\Middleware;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CanchaController extends Controller
{
    #[Middleware("permission:listar canchas")]
    public function index(Request $request)
    {
        $user = Auth::user();

        $nombre     = trim((string) $request->input('nombre', ''));
        $tipoPiso   = (string) $request->input('tipo_piso', '');
        $estado     = (string) $request->input('estado', ''); // '1' = disponible, '0' = no disponible, '' = todos
        $precioMax  = (string) $request->input('precio_max', '');
        $orden      = $request->input('orden', 'nombre');
        $direccion  = $request->input('direccion', 'asc');
        $porPagina  = (int) $request->input('por_pagina', 5);

        $camposPermitidos = ['nombre', 'tamanio', 'tipo_piso', 'precio', 'disponible'];
        if (!in_array($orden, $camposPermitidos, true)) {
            $orden = 'nombre';
        }
        if (!in_array($direccion, ['asc', 'desc'], true)) {
            $direccion = 'asc';
        }
        if (!in_array($porPagina, [5, 10, 20], true)) {
            $porPagina = 5;
        }

        $query = Cancha::activos();

        // Filtrado estricto al complejo propio del admin o empleado
        if ($user->hasAnyRole(['admin', 'empleado'])) {
            $miComplejo = $user->obtenerComplejoGestionado();

            if ($miComplejo && $miComplejo->activo) {
                $query->where('complejo_id', $miComplejo->id);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        $canchas = $query
            ->when($nombre !== '', fn ($q) => $q->where('nombre', 'like', "%{$nombre}%"))
            ->when($tipoPiso !== '', fn ($q) => $q->where('tipo_piso', $tipoPiso))
            ->when($estado !== '', fn ($q) => $q->where('disponible', (bool) ((int) $estado)))
            ->when($precioMax !== '' && is_numeric($precioMax), fn ($q) => $q->where('precio', '<=', (float) $precioMax))
            ->orderBy($orden, $direccion)
            ->paginate($porPagina)
            ->withQueryString();

        return Inertia::render('Canchas/Index', [
            'canchas' => $canchas,
            'filtros' => [
                'nombre'     => $nombre,
                'tipo_piso'  => $tipoPiso,
                'estado'     => $estado,
                'precio_max' => $precioMax,
                'orden'      => $orden,
                'direccion'  => $direccion,
                'por_pagina' => $porPagina,
            ],
        ]);
    }

    #[Middleware("permission:crear canchas")]
    public function create()
    {
        $user = Auth::user();
        abort_if($user->hasRole('empleado'), 403);

        $miComplejo = $user->obtenerComplejoGestionado();
        abort_unless($miComplejo && $miComplejo->activo, 403, 'No tienes un complejo activo asignado.');

        return Inertia::render('Canchas/Create', [
            'complejo' => [
                'id'          => $miComplejo->id,
                'nombre'      => $miComplejo->nombre,
                'precio_base' => $miComplejo->precio_base,
                'tipo_piso'   => $miComplejo->tipo_piso,
            ],
        ]);
    }

    #[Middleware("permission:crear canchas")]
    public function store(StoreCanchaRequest $request)
    {
        $user = Auth::user();
        abort_if($user->hasRole('empleado'), 403);

        $miComplejo = $user->obtenerComplejoGestionado();
        abort_unless($miComplejo && $miComplejo->activo, 403, 'No tienes un complejo activo asignado.');

        $validated = $request->validated();
        $validated['complejo_id'] = $miComplejo->id;
        $validated['activo'] = true;

        DB::transaction(function () use ($validated) {
            $cancha = Cancha::create($validated);

            // Clonar horarios de otra cancha activa del mismo complejo si existe
            $canchaReferencia = Cancha::activos()
                ->where('complejo_id', $cancha->complejo_id)
                ->where('id', '!=', $cancha->id)
                ->first();

            if ($canchaReferencia) {
                $horarios = Horario::where('cancha_id', $canchaReferencia->id)->get();
                foreach ($horarios as $horario) {
                    Horario::create([
                        'cancha_id'  => $cancha->id,
                        'start_time' => $horario->start_time,
                        'end_time'   => $horario->end_time,
                    ]);
                }
            }
        });

        return redirect()
            ->route('canchas.index')
            ->with('success', 'Cancha creada correctamente.');
    }

    #[Middleware("permission:ver canchas")]
    public function show(Cancha $cancha)
    {
        $this->autorizarAccesoCancha($cancha);

        $cancha->load([
            'complejo:id,nombre',
            'horarios' => fn ($q) => $q->orderBy('start_time'),
        ]);

        return Inertia::render('Canchas/Show', [
            'cancha' => $cancha,
        ]);
    }

    #[Middleware("permission:editar canchas")]
    public function edit(Cancha $cancha)
    {
        abort_if(Auth::user()->hasRole('empleado'), 403);
        $this->autorizarAccesoCancha($cancha);

        $cancha->load('complejo:id,nombre');

        return Inertia::render('Canchas/Edit', [
            'cancha' => $cancha,
        ]);
    }

    #[Middleware("permission:editar canchas")]
    public function update(UpdateCanchaRequest $request, Cancha $cancha)
    {
        abort_if(Auth::user()->hasRole('empleado'), 403);
        $this->autorizarAccesoCancha($cancha);

        $cancha->update($request->validated());

        return redirect()
            ->route('canchas.index')
            ->with('success', 'Cancha actualizada correctamente.');
    }

    #[Middleware("permission:eliminar canchas")]
    public function destroy(Cancha $cancha)
    {
        abort_if(Auth::user()->hasRole('empleado'), 403);
        $this->autorizarAccesoCancha($cancha);

        $tieneReservasFuturas = Reserva::whereHas('horario', fn ($q) => $q->where('cancha_id', $cancha->id))
            ->whereDate('fecha', '>=', now()->toDateString())
            ->whereIn('estado', [Reserva::ESTADO_PENDIENTE, Reserva::ESTADO_CONFIRMADA])
            ->exists();

        if ($tieneReservasFuturas) {
            return redirect()
                ->route('canchas.index')
                ->with('error', 'No se puede desactivar la cancha porque tiene reservas activas a futuro.');
        }

        $cancha->update([
            'activo'     => false,
            'disponible' => false,
        ]);

        return redirect()
            ->route('canchas.index')
            ->with('success', 'Cancha desactivada correctamente.');
    }

    private function autorizarAccesoCancha(Cancha $cancha): void
    {
        abort_unless($cancha->activo, 404);

        $user = Auth::user();
        if ($user->hasAnyRole(['admin', 'empleado'])) {
            $miComplejo = $user->obtenerComplejoGestionado();
            abort_unless($miComplejo && $cancha->complejo_id === $miComplejo->id, 403);
        }
    }
}