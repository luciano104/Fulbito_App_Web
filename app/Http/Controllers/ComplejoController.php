<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreComplejoRequest;
use App\Http\Requests\UpdateComplejoRequest;
use App\Mail\ComplejoCreadoMail;
use App\Models\Cancha;
use App\Models\Complejo;
use App\Models\Horario;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Attributes\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

#[Middleware("role:super-admin")]
class ComplejoController extends Controller
{
    public function index(Request $request)
    {
        $nombre    = trim((string) $request->input('nombre', ''));
        $direccion = trim((string) $request->input('direccion', ''));
        $admin     = (string) $request->input('admin', '');
        $orden     = $request->input('orden', 'nombre');
        $dirOrden  = $request->input('dir_orden', 'asc');

        $camposPermitidos = ['nombre', 'direccion', 'precio_base', 'avg_rating'];
        if (!in_array($orden, $camposPermitidos, true)) {
            $orden = 'nombre';
        }
        if (!in_array($dirOrden, ['asc', 'desc'], true)) {
            $dirOrden = 'asc';
        }

        $porPagina = (int) $request->input('por_pagina', 5);
        if (!in_array($porPagina, [5, 10, 20], true)) {
            $porPagina = 5;
        }

        $complejos = Complejo::activos()
            ->with('admin:id,name,email')
            ->withCount(['canchas' => fn ($q) => $q->where('activo', true)])
            ->when($nombre !== '', fn ($q) => $q->where('nombre', 'like', "%{$nombre}%"))
            ->when($direccion !== '', fn ($q) => $q->where('direccion', 'like', "%{$direccion}%"))
            ->when($admin !== '', fn ($q) => $q->where('admin_id', $admin))
            ->orderBy($orden, $dirOrden)
            ->paginate($porPagina)
            ->withQueryString();

        return Inertia::render('Complejos/Index', [
            'complejos' => $complejos,
            'admins'    => User::role('admin')->orderBy('name')->get(['id', 'name']),
            'filtros'   => [
                'nombre'     => $nombre,
                'direccion'  => $direccion,
                'admin'      => $admin,
                'orden'      => $orden,
                'dir_orden'  => $dirOrden,
                'por_pagina' => $porPagina,
            ],
        ]);
    }

    public function create()
    {
        $adminsDisponibles = User::role('admin')
            ->whereDoesntHave('complejoAdministrado')
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return Inertia::render('Complejos/Create', [
            'admins' => $adminsDisponibles,
        ]);
    }

    public function store(StoreComplejoRequest $request)
    {
        $validated = $request->validated();
        $infoCredenciales = [];
        $datosCorreo = null;

        DB::transaction(function () use ($validated, &$infoCredenciales, &$datosCorreo) {
            $slugBase = Str::slug($validated['nombre'], '') ?: 'complejo';
            $passAdmin = 'dueno123';
            $adminEsNuevo = false;

            // 1. Crear Dueño con el email obligatorio ingresado o vincular existente
            if (empty($validated['admin_id'])) {
                $emailAdmin = trim($validated['admin_email']);
                $adminUser = User::create([
                    'name'     => 'Dueño - ' . $validated['nombre'],
                    'email'    => $emailAdmin,
                    'password' => Hash::make($passAdmin),
                ]);
                $adminUser->assignRole('admin');

                $validated['admin_id'] = $adminUser->id;
                $adminEsNuevo = true;
                $infoCredenciales[] = "Dueño: {$emailAdmin} (Clave: {$passAdmin})";
            } else {
                $adminUser = User::findOrFail($validated['admin_id']);
            }

            unset($validated['admin_email']);
            $validated['avg_rating'] = 0;
            $validated['total_reviews'] = 0;
            $validated['activo'] = true;

            // 2. Crear Complejo
            $complejo = Complejo::create($validated);

            // 3. Crear Cancha 1 por defecto
            $cancha = Cancha::create([
                'complejo_id' => $complejo->id,
                'nombre'      => 'Cancha 1',
                'tamanio'     => Cancha::TIPO_F5,
                'tipo_piso'   => $complejo->tipo_piso,
                'precio'      => $complejo->precio_base,
                'disponible'  => true,
                'activo'      => true,
            ]);

            // 4. Horarios base iniciales
            $horarios = [
                ['16:00:00', '17:00:00'],
                ['17:00:00', '18:00:00'],
                ['18:00:00', '19:00:00'],
                ['19:00:00', '20:00:00'],
                ['20:00:00', '21:00:00'],
                ['21:00:00', '22:00:00'],
            ];

            foreach ($horarios as [$inicio, $fin]) {
                Horario::create([
                    'cancha_id'  => $cancha->id,
                    'start_time' => $inicio,
                    'end_time'   => $fin,
                ]);
            }

            // 5. Crear Empleado genérico vinculado al complejo
            $emailEmpleado = "empleado.{$slugBase}@fulbito.com";
            $contadorEmp = 1;
            while (User::where('email', $emailEmpleado)->exists()) {
                $emailEmpleado = "empleado.{$slugBase}{$contadorEmp}@fulbito.com";
                $contadorEmp++;
            }

            $passEmpleado = 'empleado123';
            $empleado = User::create([
                'name'        => 'Empleado - ' . $complejo->nombre,
                'email'       => $emailEmpleado,
                'password'    => Hash::make($passEmpleado),
                'complejo_id' => $complejo->id,
            ]);
            $empleado->assignRole('empleado');

            $infoCredenciales[] = "Empleado: {$emailEmpleado} (Clave: {$passEmpleado})";

            $datosCorreo = [
                'admin_nombre'        => $adminUser->name,
                'admin_email'         => $adminUser->email,
                'admin_password'      => $adminEsNuevo ? $passAdmin : '(Tu contraseña actual)',
                'complejo_nombre'     => $complejo->nombre,
                'complejo_direccion'  => $complejo->direccion,
                'complejo_latitud'    => $complejo->latitud,
                'complejo_longitud'   => $complejo->longitud,
                'complejo_precio_base'=> $complejo->precio_base,
                'complejo_tipo_piso'  => $complejo->tipo_piso,
                'empleado_email'      => $emailEmpleado,
                'empleado_password'   => $passEmpleado,
            ];
        });

        // Enviar correo con los datos del complejo y credenciales al dueño
        if ($datosCorreo && !empty($datosCorreo['admin_email'])) {
            Mail::to($datosCorreo['admin_email'])->send(new ComplejoCreadoMail($datosCorreo));
        }

        $mensaje = 'Complejo creado y correo enviado al dueño. Credenciales → ' . implode(' | ', $infoCredenciales);

        return redirect()
            ->route('complejos.index')
            ->with('success', $mensaje);
    }

    public function show(Complejo $complejo)
    {
        $complejo->load([
            'admin:id,name,email',
            'empleados:id,name,email,complejo_id',
            'canchas' => fn ($q) => $q->where('activo', true),
        ]);

        return Inertia::render('Complejos/Show', [
            'complejo' => $complejo,
        ]);
    }

    public function edit(Complejo $complejo)
    {
        $complejo->load('admin:id,name,email');

        return Inertia::render('Complejos/Edit', [
            'complejo' => $complejo,
        ]);
    }

    public function update(UpdateComplejoRequest $request, Complejo $complejo)
    {
        $complejo->update($request->validated());

        return redirect()
            ->route('complejos.index')
            ->with('success', 'Complejo actualizado correctamente.');
    }

    public function destroy(Complejo $complejo)
    {
        DB::transaction(function () use ($complejo) {
            $complejo->canchas()->update([
                'activo'     => false,
                'disponible' => false,
            ]);
            $complejo->update(['activo' => false]);
        });

        return redirect()
            ->route('complejos.index')
            ->with('success', 'Complejo desactivado correctamente.');
    }
}