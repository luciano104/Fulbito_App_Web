<?php

namespace Database\Seeders;

use App\Models\Complejo;
use App\Models\User;
use Illuminate\Database\Seeder;

class ComplejoSeeder extends Seeder
{
    public function run(): void
    {
        $admin1 = User::where('email', 'admin@example.com')->first();
        $empleado1 = User::where('email', 'empleado@example.com')->first();

        $complejo1 = Complejo::create([
            'nombre'        => 'Complejo 1',
            'direccion'     => 'Av. Belgrano 123',
            'latitud'       => -24.787959885749398,
            'longitud'      => -65.40704094238349,
            'precio_base'   => 25000,
            'tipo_piso'     => Complejo::PISO_SINTETICO,
            'avg_rating'    => 0,
            'total_reviews' => 0,
            'activo'        => true,
            'admin_id'      => $admin1->id,
        ]);

        // Vincular el empleado de prueba al Complejo 1
        if ($empleado1) {
            $empleado1->update(['complejo_id' => $complejo1->id]);
        }

        // Segundo dueño y segundo complejo con su empleado genérico
        $admin2 = User::firstOrCreate(
            ['email' => 'admin2@example.com'],
            ['name' => 'Admin Complejo 2', 'password' => bcrypt('1234')]
        );
        $admin2->assignRole('admin');

        $complejo2 = Complejo::create([
            'nombre'        => 'Complejo 2',
            'direccion'     => 'Unsa',
            'latitud'       => -24.735344081829425,
            'longitud'      => -65.41072410683762,
            'precio_base'   => 15000,
            'tipo_piso'     => Complejo::PISO_TIERRA,
            'avg_rating'    => 0,
            'total_reviews' => 0,
            'activo'        => true,
            'admin_id'      => $admin2->id,
        ]);

        $empleado2 = User::firstOrCreate(
            ['email' => 'empleado.complejo2@fulbito.com'],
            [
                'name'        => 'Empleado - Complejo 2',
                'password'    => bcrypt('empleado123'),
                'complejo_id' => $complejo2->id,
            ]
        );
        $empleado2->assignRole('empleado');
    }
}