<?php

namespace Database\Seeders;

use App\Models\Complejo;
use App\Models\Resenia;
use App\Models\Reserva;
use Illuminate\Database\Seeder;

class ReseniaSeeder extends Seeder
{
    public function run(): void
    {
        // Todas las reservas completadas hechas por jugadores registrados que aún no tienen reseña
        $reservas = Reserva::where('estado', Reserva::ESTADO_COMPLETADA)
            ->whereNotNull('jugador_id')
            ->doesntHave('resenia')
            ->get();

        if ($reservas->isEmpty()) {
            return;
        }

        $comentariosPorCalificacion = [
            5 => [
                'Muy buena cancha y excelente iluminación.',
                'Impecable el estado del césped y muy buena onda en recepción.',
                'Todo de diez, puntualidad perfecta y vestuarios limpios.',
            ],
            4 => [
                'Buena atención en el complejo, muy recomendable.',
                'Linda cancha para jugar con amigos, volveremos seguro.',
                'Muy buen predio, solo faltó un poco más de luz en un córner.',
            ],
            3 => [
                'La cancha está bien, aunque la pelota estaba algo desinflada.',
                'Cumple, pero se demoraron 10 minutos en entregarnos el turno.',
            ],
            2 => [
                'El piso estaba bastante resbaladizo y faltaba mantenimiento.',
            ],
            1 => [
                'El césped estaba muy gastado, no la pasamos bien.',
            ],
        ];

        // Distribución realista inclinada hacia buenas calificaciones
        $poolCalificaciones = [5, 5, 5, 4, 4, 4, 3, 3, 2, 1];

        foreach ($reservas as $reserva) {
            $calificacion = $poolCalificaciones[array_rand($poolCalificaciones)];
            $opcionesComentarios = $comentariosPorCalificacion[$calificacion];
            $comentario = $opcionesComentarios[array_rand($opcionesComentarios)];

            Resenia::create([
                'calificacion' => $calificacion,
                'comentario'   => $comentario,
                'reserva_id'   => $reserva->id,
                'publicado_en' => $reserva->fecha->copy()->setTime(23, 0),
                'activo'       => true,
            ]);
        }

        // Recalcular promedios y totales reales en todos los complejos
        Complejo::all()->each->recalcularRating();
    }
}