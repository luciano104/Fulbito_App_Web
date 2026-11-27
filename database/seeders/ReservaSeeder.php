<?php

namespace Database\Seeders;

use App\Models\Horario;
use App\Models\Reserva;
use App\Models\User;
use Illuminate\Database\Seeder;

class ReservaSeeder extends Seeder
{
    public function run(): void
    {
        $jugadores = User::role('jugador')->get();

        // Obtenemos todos los horarios de las canchas del Complejo 1 junto con su cancha
        $horariosComplejo1 = Horario::with('cancha')
            ->whereHas('cancha', function ($query) {
                $query->where('complejo_id', 1);
            })->get();

        if ($jugadores->isEmpty() || $horariosComplejo1->isEmpty()) {
            return;
        }

        $nombresPresenciales = [
            'Carlos Gómez',
            'Martín Rodríguez',
            'Lucas Fernández',
            'Diego Martínez',
            'Sofía Pérez',
            'Valentín López',
        ];

        $estadosPasados = [
            Reserva::ESTADO_COMPLETADA,
            Reserva::ESTADO_COMPLETADA,
            Reserva::ESTADO_COMPLETADA,
            Reserva::ESTADO_CANCELADA,
        ];

        $estadosManiana = [
            Reserva::ESTADO_PENDIENTE,
            Reserva::ESTADO_CONFIRMADA,
        ];

        $turnosOcupados = [];

        // 1. Generar reservas históricas (desde hace 30 días hasta ayer)
        for ($diasAtras = 30; $diasAtras >= 1; $diasAtras--) {
            $fecha = now()->subDays($diasAtras)->toDateString();

            $cantidadPorDia = rand(2, min(4, $horariosComplejo1->count()));
            $horariosDelDia = $horariosComplejo1->random($cantidadPorDia);

            foreach ($horariosDelDia as $horario) {
                $clave = "{$fecha}_{$horario->id}";
                if (isset($turnosOcupados[$clave])) {
                    continue;
                }
                $turnosOcupados[$clave] = true;

                $esPresencial = rand(1, 4) === 1;

                Reserva::create([
                    'fecha'            => $fecha,
                    'estado'           => $estadosPasados[array_rand($estadosPasados)],
                    'precio_historico' => $horario->cancha->precio,
                    'jugador_id'       => $esPresencial ? null : $jugadores->random()->id,
                    'nya_jugador'      => $esPresencial ? $nombresPresenciales[array_rand($nombresPresenciales)] : null,
                    'horario_id'       => $horario->id,
                ]);
            }
        }

        // 2. Generar reservas para mañana (pendiente o confirmada)
        $fechaManiana = now()->addDay()->toDateString();
        $horariosPorCancha = $horariosComplejo1->groupBy('cancha_id');

        foreach ($horariosPorCancha as $horariosCancha) {
            $seleccionados = $horariosCancha->take(3);

            foreach ($seleccionados as $indice => $horario) {
                $esPresencial = ($indice === 2);

                Reserva::create([
                    'fecha'            => $fechaManiana,
                    'estado'           => $estadosManiana[$indice % 2],
                    'precio_historico' => $horario->cancha->precio,
                    'jugador_id'       => $esPresencial ? null : $jugadores->random()->id,
                    'nya_jugador'      => $esPresencial ? $nombresPresenciales[array_rand($nombresPresenciales)] : null,
                    'horario_id'       => $horario->id,
                ]);
            }
        }
    }
}