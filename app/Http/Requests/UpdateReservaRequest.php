<?php

namespace App\Http\Requests;

use App\Models\Reserva;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReservaRequest extends FormRequest
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
        $reserva = $this->route('reserva');

        $transicionesPermitidas = match ($reserva?->estado) {
            Reserva::ESTADO_PENDIENTE  => [Reserva::ESTADO_CONFIRMADA, Reserva::ESTADO_CANCELADA],
            Reserva::ESTADO_CONFIRMADA => [Reserva::ESTADO_CANCELADA, Reserva::ESTADO_COMPLETADA],
            default                    => [],
        };

        return [
            'estado' => [
                'required',
                'string',
                Rule::in(Reserva::ESTADOS),
                function ($attribute, $value, $fail) use ($reserva, $transicionesPermitidas) {
                    if (!$reserva) {
                        return;
                    }

                    if (in_array($reserva->estado, [Reserva::ESTADO_COMPLETADA, Reserva::ESTADO_CANCELADA], true)) {
                        $fail("Una reserva {$reserva->estado} no puede cambiar de estado.");
                        return;
                    }

                    if (!in_array($value, $transicionesPermitidas, true)) {
                        $fail("No se puede cambiar el estado de {$reserva->estado} a {$value}.");
                    }
                },
            ],
        ];
    }

    public function attributes(): array
    {
        return [
            'estado' => 'estado de la reserva',
        ];
    }

    public function messages(): array
    {
        return [
            'required' => 'El campo :attribute es obligatorio.',
            'in'       => 'El :attribute seleccionado no es válido.',
        ];
    }
}