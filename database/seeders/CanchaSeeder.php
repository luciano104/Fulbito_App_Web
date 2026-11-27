<?php

namespace Database\Seeders;

use App\Models\Cancha;
use App\Models\Complejo;
use Illuminate\Database\Seeder;

class CanchaSeeder extends Seeder
{
    public function run(): void
    {
        Cancha::create([
            'nombre'      => 'Cancha 1',
            'tamanio'     => Cancha::TIPO_F5,
            'tipo_piso'   => Complejo::PISO_PASTO,
            'precio'      => 25000,
            'disponible'  => true,
            'activo'      => true,
            'complejo_id' => 1,
        ]);

        Cancha::create([
            'nombre'      => 'Cancha 2',
            'tamanio'     => Cancha::TIPO_F11,
            'tipo_piso'   => Complejo::PISO_TIERRA,
            'precio'      => 30000,
            'disponible'  => true,
            'activo'      => true,
            'complejo_id' => 1,
        ]);

        Cancha::create([
            'nombre'      => 'Cancha 1',
            'tamanio'     => Cancha::TIPO_F11,
            'tipo_piso'   => Complejo::PISO_TIERRA,
            'precio'      => 15000,
            'disponible'  => true,
            'activo'      => true,
            'complejo_id' => 2,
        ]);
    }
}