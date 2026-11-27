<?php

namespace App\Http\Requests;

use App\Models\Horario;
use App\Models\Reserva;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class StoreReservaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $fecha = $this->input('fecha');

        return [
            'fecha' => ['required', 'date', 'after_or_equal:today'],
            'estado' => [
                'required',
                'string',
                Rule::in([Reserva::ESTADO_PENDIENTE, Reserva::ESTADO_CONFIRMADA]),
            ],
            'jugador_id' => ['nullable', 'integer', 'exists:users,id'],
            'nya_jugador' => ['nullable', 'string', 'max:150'],
            'horario_id' => [
                'required',
                'integer',
                'exists:horarios,id',
                function ($attribute, $value, $fail) use ($fecha) {
                    if (!$fecha)
                        return;

                    $ocupado = Reserva::whereDate('fecha', $fecha)
                        ->where('horario_id', $value)
                        ->whereIn('estado', [
                            Reserva::ESTADO_PENDIENTE,
                            Reserva::ESTADO_CONFIRMADA,
                            Reserva::ESTADO_COMPLETADA,
                        ])
                        ->exists();

                    if ($ocupado) {
                        $fail('Este horario ya se encuentra reservado para la fecha seleccionada.');
                    }
                },
            ],
        ];
    }

    public function attributes(): array
    {
        return [
            'fecha' => 'fecha de la reserva',
            'estado' => 'estado de la reserva',
            'jugador_id' => 'jugador registrado',
            'nya_jugador' => 'nombre y apellido del jugador',
            'horario_id' => 'horario seleccionado',
        ];
    }

    public function messages(): array
    {
        return [
            'required' => 'El campo :attribute es obligatorio.',
            'required_without' => 'Debe ingresar el :attribute si no selecciona un jugador registrado.',
            'date' => 'El campo :attribute debe ser una fecha válida.',
            'after_or_equal' => 'La :attribute debe ser hoy o una fecha posterior.',
            'in' => 'El :attribute seleccionado no es válido.',
            'integer' => 'El campo :attribute debe ser un número entero.',
            'max' => 'El campo :attribute no debe superar los :max caracteres.',
            'exists' => 'El :attribute seleccionado no existe o no cuenta con el rol de jugador.',
        ];
    }
}