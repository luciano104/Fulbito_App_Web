<?php

namespace Database\Seeders;

use App\Models\Cancha;
use App\Models\Horario;
use Illuminate\Database\Seeder;

class HorarioSeeder extends Seeder
{
    public function run(): void
    {
        $canchas = Cancha::activos()->get();

        // Rangos de horas base (de 16:00 a 22:00)
        $horas = [
            ['16:00:00', '17:00:00'],
            ['17:00:00', '18:00:00'],
            ['18:00:00', '19:00:00'],
            ['19:00:00', '20:00:00'],
            ['20:00:00', '21:00:00'],
            ['21:00:00', '22:00:00'],
        ];

        foreach ($canchas as $cancha) {
            foreach ($horas as [$inicio, $fin]) {
                Horario::firstOrCreate([
                    'cancha_id'  => $cancha->id,
                    'start_time' => $inicio,
                ], [
                    'end_time'   => $fin,
                ]);
            }
        }
    }
}