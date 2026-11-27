<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Limpiar la caché de los permisos de Spatie
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permisos = [
            // COMPLEJOS
            'listar complejos', 'crear complejos', 'ver complejos', 'editar complejos', 'eliminar complejos',
            // USUARIOS
            'listar usuarios', 'crear usuarios', 'ver usuarios', 'editar usuarios', 'eliminar usuarios',
            // CANCHAS
            'listar canchas', 'crear canchas', 'ver canchas', 'editar canchas', 'eliminar canchas',
            // HORARIOS (sin editar/ver redundantes, solo listar, crear y eliminar)
            'listar horarios', 'crear horarios', 'eliminar horarios',
            // RESERVAS
            'listar reservas', 'crear reservas', 'ver reservas', 'editar reservas', 'eliminar reservas',
            // RESEÑAS
            'listar resenias', 'ver resenias', 'eliminar resenias',
            // REPORTES (PDF / EXCEL)
            'descargar reportes',
        ];

        foreach ($permisos as $permiso) {
            Permission::firstOrCreate(['name' => $permiso]);
        }

        // Roles definitivos de la plataforma
        $roleSuperAdmin = Role::firstOrCreate(['name' => 'super-admin']);
        $roleAdmin      = Role::firstOrCreate(['name' => 'admin']);
        $roleEmpleado   = Role::firstOrCreate(['name' => 'empleado']);
        $roleJugador    = Role::firstOrCreate(['name' => 'jugador']);

        // 1. Super-Admin: gestión comercial SaaS (complejos, dueños/empleados y reportes propios)
        // Nota: Si usas Gate::before en AppServiceProvider, tendrá acceso global; aquí definimos sus permisos explícitos.
        $roleSuperAdmin->syncPermissions([
            'listar complejos', 'crear complejos', 'ver complejos', 'editar complejos', 'eliminar complejos',
            'listar usuarios', 'crear usuarios', 'ver usuarios', 'editar usuarios', 'eliminar usuarios',
            'descargar reportes',
        ]);

        // 2. Admin (Dueño del complejo): gestiona su complejo, su empleado, canchas, horarios, reservas, reseñas y reportes
        $roleAdmin->syncPermissions([
            'ver complejos', 'editar complejos',
            'listar usuarios', 'crear usuarios', 'ver usuarios', 'editar usuarios', 'eliminar usuarios',
            'listar canchas', 'crear canchas', 'ver canchas', 'editar canchas', 'eliminar canchas',
            'listar horarios', 'crear horarios', 'eliminar horarios',
            'listar reservas', 'crear reservas', 'ver reservas', 'editar reservas', 'eliminar reservas',
            'listar resenias', 'ver resenias', 'eliminar resenias',
            'descargar reportes',
        ]);

        // 3. Empleado: consulta canchas y horarios (sin crear/editar/eliminar) y opera reservas diarias
        $roleEmpleado->syncPermissions([
            'listar canchas', 'ver canchas',
            'listar horarios',
            'listar reservas', 'crear reservas', 'ver reservas', 'editar reservas',
            'listar resenias', 'ver resenias',
        ]);

        // 4. Jugador: consulta complejos/canchas/horarios y gestiona sus propias reservas
        $roleJugador->syncPermissions([
            'listar complejos', 'ver complejos',
            'listar canchas', 'ver canchas',
            'listar horarios',
            'listar reservas', 'crear reservas', 'ver reservas',
        ]);

        // --- USUARIOS DE PRUEBA ---

        // Super-Admins
        User::firstOrCreate(
            ['email' => 'superadmin@example.com'],
            ['name' => 'Super Admin', 'password' => bcrypt('password')]
        )->syncRoles([$roleSuperAdmin]);

        User::firstOrCreate(
            ['email' => 'lucianoburgos104@gmail.com'],
            ['name' => 'Luciano Burgos', 'password' => bcrypt('Luciano.104')]
        )->syncRoles([$roleSuperAdmin]);

        // Admin (Dueño) 1
        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Admin Complejo 1', 'password' => bcrypt('1234')]
        )->syncRoles([$roleAdmin]);

        // Empleado de prueba (se vincula a complejo_id en ComplejoSeeder)
        User::firstOrCreate(
            ['email' => 'empleado@example.com'],
            ['name' => 'Empleado Complejo 1', 'password' => bcrypt('1234')]
        )->syncRoles([$roleEmpleado]);

        // Jugador principal + 10 jugadores de relleno
        User::firstOrCreate(
            ['email' => 'jugador@example.com'],
            ['name' => 'Jugador', 'password' => bcrypt('1234')]
        )->syncRoles([$roleJugador]);

        User::factory(10)->create()->each(function (User $user) use ($roleJugador) {
            $user->assignRole($roleJugador);
        });
    }
}