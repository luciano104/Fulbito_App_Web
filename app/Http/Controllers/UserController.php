<?php

namespace App\Http\Controllers;

use App\Mail\UsuarioCredencialesMail;
use App\Models\Complejo;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Attributes\Controllers\Middleware;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    #[Middleware("permission:listar usuarios")]
    public function index(): Response
    {
        $authUser = Auth::user();

        $query = User::with(['roles:id,name', 'complejo:id,nombre', 'complejoAdministrado:id,nombre,admin_id']);

        if ($authUser->hasRole('admin')) {
            $miComplejo = $authUser->obtenerComplejoGestionado();
            if ($miComplejo) {
                $query->where('complejo_id', $miComplejo->id);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        $users = $query->get(['id', 'name', 'email', 'password', 'complejo_id'])
            ->map(function (User $u) {
                $camposPorDefecto = $this->detectarDatosPorDefecto($u);

                return [
                    'id'                   => $u->id,
                    'name'                 => $u->name,
                    'email'                => $u->email,
                    'complejo_id'          => $u->complejo_id,
                    'complejo'             => $u->complejo,
                    'complejo_administrado'=> $u->complejoAdministrado,
                    'roles'                => $u->roles,
                    'tiene_datos_defecto'  => count($camposPorDefecto) > 0,
                    'campos_defecto'       => $camposPorDefecto,
                ];
            });

        return Inertia::render('users/index', [
            'users' => $users,
        ]);
    }

    #[Middleware("permission:crear usuarios")]
    public function create(): Response
    {
        $authUser = Auth::user();
        $miComplejo = $authUser->hasRole('admin') ? $authUser->obtenerComplejoGestionado() : null;

        return Inertia::render('users/create', [
            'roles'     => $authUser->hasRole('super-admin')
                ? Role::get(['id', 'name'])
                : Role::where('name', 'empleado')->get(['id', 'name']),
            'complejos' => $authUser->hasRole('super-admin')
                ? Complejo::activos()->orderBy('nombre')->get(['id', 'nombre'])
                : [],
            'miComplejo' => $miComplejo ? $miComplejo->only(['id', 'nombre']) : null,
        ]);
    }

    #[Middleware("permission:crear usuarios")]
    public function store(Request $request): RedirectResponse
    {
        $authUser = Auth::user();

        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'email'       => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password'    => ['required', 'confirmed', Password::defaults()],
            'roles'       => ['nullable', 'array'],
            'complejo_id' => ['nullable', 'integer', Rule::exists('complejos', 'id')->where('activo', true)],
        ]);

        if ($authUser->hasRole('admin')) {
            $miComplejo = $authUser->obtenerComplejoGestionado();
            abort_unless($miComplejo !== null, 403, 'No tienes un complejo activo asignado.');
            $validated['complejo_id'] = $miComplejo->id;
            $roles = ['empleado'];
        } else {
            $request->validate(['roles' => ['required', 'array', 'min:1']]);
            $roles = $request->input('roles', []);
            if (!in_array('empleado', $roles, true)) {
                $validated['complejo_id'] = null;
            }
        }

        $passwordPlano = $validated['password'];
        $validated['password'] = Hash::make($passwordPlano);

        $user = User::create($validated);
        $user->syncRoles($roles);

        // Enviar credenciales por Mailtrap si el correo no es ficticio de dominio interno
        if (!str_ends_with($user->email, '@fulbito.com')) {
            Mail::to($user->email)->send(new UsuarioCredencialesMail([
                'asunto'        => 'Tu cuenta en Fulbito App ha sido creada',
                'mensaje_intro' => 'Se ha registrado una cuenta a tu nombre en el sistema de gestión de complejos deportivos:',
                'user_nombre'   => $user->name,
                'user_email'    => $user->email,
                'user_password' => $passwordPlano,
            ]));
        }

        return redirect()
            ->route('users.index')
            ->with('success', $authUser->hasRole('admin') ? 'Empleado agregado correctamente.' : 'Usuario creado correctamente.');
    }

    #[Middleware("permission:ver usuarios")]
    public function show(User $user): Response
    {
        $this->autorizarGestionUsuario($user);

        return Inertia::render('users/show', [
            'user'        => $user->load(['roles:id,name', 'complejo:id,nombre', 'complejoAdministrado:id,nombre,admin_id']),
            'permissions' => $user->getAllPermissions()->map(fn ($perm) => [
                'id'   => $perm->id,
                'name' => $perm->name,
            ]),
        ]);
    }

    #[Middleware("permission:editar usuarios")]
    public function edit(User $user): Response
    {
        $this->autorizarGestionUsuario($user);

        $authUser = Auth::user();
        $camposPorDefecto = $this->detectarDatosPorDefecto($user);

        return Inertia::render('users/edit', [
            'user'               => $user->only(['id', 'name', 'email', 'complejo_id']),
            'roles'              => $authUser->hasRole('super-admin')
                ? Role::get(['id', 'name'])
                : Role::where('name', 'empleado')->get(['id', 'name']),
            'complejos'          => $authUser->hasRole('super-admin')
                ? Complejo::activos()->orderBy('nombre')->get(['id', 'nombre'])
                : [],
            'userRoles'          => $user->roles->pluck('name'),
            'camposPorDefecto'   => $camposPorDefecto,
        ]);
    }

    #[Middleware("permission:editar usuarios")]
    public function update(Request $request, User $user): RedirectResponse
    {
        $this->autorizarGestionUsuario($user);

        if (Gate::has('update')) {
            Gate::authorize('update', $user);
        }

        $authUser = Auth::user();

        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'email'       => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password'    => ['nullable', Password::defaults()],
            'roles'       => ['array'],
            'complejo_id' => ['nullable', 'integer', Rule::exists('complejos', 'id')->where('activo', true)],
        ]);

        if ($authUser->id === $user->id && $user->hasRole('super-admin')) {
            if (!in_array('super-admin', $request->input('roles', []), true)) {
                return redirect()->back()->withErrors([
                    'roles' => 'No puedes quitarte a ti mismo el rol de Super Admin.',
                ])->withInput();
            }
        }

        $passwordNueva = null;
        if (!empty($validated['password'])) {
            $passwordNueva = $validated['password'];
            $validated['password'] = Hash::make($passwordNueva);
        } else {
            unset($validated['password']);
        }

        if ($authUser->hasRole('admin')) {
            unset($validated['complejo_id']);
            $user->update($validated);
        } else {
            $roles = $request->input('roles', []);
            if (!in_array('empleado', $roles, true)) {
                $validated['complejo_id'] = null;
            }
            $user->update($validated);
            $user->syncRoles($roles);
        }

        // Notificar por correo si se cambió email o contraseña
        if (($passwordNueva !== null || $user->wasChanged('email')) && !str_ends_with($user->email, '@fulbito.com')) {
            Mail::to($user->email)->send(new UsuarioCredencialesMail([
                'asunto'        => 'Actualización de credenciales - Fulbito App',
                'mensaje_intro' => 'Tus datos de acceso en Fulbito App han sido actualizados:',
                'user_nombre'   => $user->name,
                'user_email'    => $user->email,
                'user_password' => $passwordNueva,
            ]));
        }

        return redirect()
            ->route('users.index')
            ->with('success', 'Usuario actualizado correctamente.');
    }

    #[Middleware("permission:eliminar usuarios")]
    public function destroy(User $user): RedirectResponse
    {
        $this->autorizarGestionUsuario($user);

        if (Gate::has('delete')) {
            Gate::authorize('delete', $user);
        }

        $user->delete();

        return redirect()
            ->route('users.index')
            ->with('success', 'Usuario eliminado correctamente.');
    }

    private function autorizarGestionUsuario(User $targetUser): void
    {
        $authUser = Auth::user();

        if ($authUser->hasRole('admin')) {
            $miComplejo = $authUser->obtenerComplejoGestionado();
            abort_unless(
                $miComplejo && $targetUser->complejo_id === $miComplejo->id && $targetUser->hasRole('empleado'),
                403,
                'Solo puedes gestionar empleados vinculados a tu complejo.'
            );
        }
    }

    /**
     * Detecta si un Admin o Empleado mantiene datos genéricos generados automáticamente.
     */
    private function detectarDatosPorDefecto(User $user): array
    {
        $campos = [];

        if ($user->hasRole('admin')) {
            if (Str::startsWith($user->name, 'Dueño - ')) {
                $campos[] = "Nombre genérico ({$user->name})";
            }
            if (Str::endsWith($user->email, '@fulbito.com')) {
                $campos[] = "Email genérico ({$user->email})";
            }
            if (Hash::check('dueno123', $user->password)) {
                $campos[] = 'Contraseña por defecto (dueno123)';
            }
        }

        if ($user->hasRole('empleado')) {
            if (Str::startsWith($user->name, 'Empleado - ')) {
                $campos[] = "Nombre genérico ({$user->name})";
            }
            if (Str::endsWith($user->email, '@fulbito.com')) {
                $campos[] = "Email genérico ({$user->email})";
            }
            if (Hash::check('empleado123', $user->password)) {
                $campos[] = 'Contraseña por defecto (empleado123)';
            }
        }

        return $campos;
    }
}