<?php

namespace App\Http\Requests;

use App\Models\Reserva;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReseniaRequest extends FormRequest
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
        $user = $this->user();

        return [
            'calificacion' => ['required', 'integer', 'between:1,5'],
            'comentario'   => ['nullable', 'string', 'max:1000'],
            'reserva_id'   => [
                'required',
                'integer',
                'exists:reservas,id',
                Rule::unique('resenias', 'reserva_id')->where(fn ($q) => $q->where('activo', true)),
                function ($attribute, $value, $fail) use ($user) {
                    $reserva = Reserva::with('horario.cancha')->find($value);

                    if (!$reserva) {
                        return;
                    }

                    if ($reserva->estado !== Reserva::ESTADO_COMPLETADA) {
                        $fail('Solo se puede dejar una reseña cuando la reserva está completada.');
                        return;
                    }

                    if (is_null($reserva->jugador_id)) {
                        $fail('Las reservas presenciales sin jugador registrado no pueden recibir reseñas.');
                        return;
                    }

                    if ($user && $user->hasRole('jugador') && $reserva->jugador_id !== $user->id) {
                        $fail('No tienes permiso para reseñar una reserva que no te pertenece.');
                        return;
                    }

                    if ($user && $user->hasAnyRole(['admin', 'empleado'])) {
                        $miComplejo = $user->obtenerComplejoGestionado();
                        if (!$miComplejo || $reserva->horario?->cancha?->complejo_id !== $miComplejo->id) {
                            $fail('La reserva seleccionada no pertenece a su complejo.');
                        }
                    }
                },
            ],
        ];
    }

    public function attributes(): array
    {
        return [
            'calificacion' => 'calificación',
            'comentario'   => 'comentario',
            'reserva_id'   => 'reserva',
        ];
    }

    public function messages(): array
    {
        return [
            'required' => 'El campo :attribute es obligatorio.',
            'integer'  => 'El campo :attribute debe ser un número entero.',
            'between'  => 'La :attribute debe estar entre :min y :max estrellas.',
            'max'      => 'El campo :attribute no debe superar los :max caracteres.',
            'exists'   => 'La :attribute seleccionada no existe en el sistema.',
            'unique'   => 'La :attribute seleccionada ya cuenta con una reseña publicada.',
        ];
    }
}