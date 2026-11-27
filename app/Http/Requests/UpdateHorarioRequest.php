<?php

namespace App\Http\Requests;

use App\Models\Cancha;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateHorarioRequest extends FormRequest
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
        $horarioId = $this->route('horario')?->id ?? $this->route('horario');
        $canchaId = $this->input('cancha_id');

        return [
            'cancha_id' => [
                'required',
                'integer',
                Rule::exists('canchas', 'id')->where('activo', true),
                function ($attribute, $value, $fail) use ($user) {
                    if ($user && $user->hasAnyRole(['admin', 'empleado'])) {
                        $miComplejo = $user->obtenerComplejoGestionado();
                        $cancha = Cancha::activos()->find($value);

                        if (!$cancha || !$miComplejo || $cancha->complejo_id !== $miComplejo->id) {
                            $fail('La cancha seleccionada no pertenece a tu complejo.');
                        }
                    }
                },
            ],
            'start_time' => [
                'required',
                'date_format:H:i:s,H:i',
                Rule::unique('horarios', 'start_time')
                    ->ignore($horarioId)
                    ->where(fn ($q) => $q->where('cancha_id', $canchaId)),
            ],
            'end_time' => [
                'required',
                'date_format:H:i:s,H:i',
                'after:start_time',
            ],
        ];
    }

    public function attributes(): array
    {
        return [
            'start_time' => 'hora de inicio',
            'end_time'   => 'hora de fin',
            'cancha_id'  => 'cancha',
        ];
    }

    public function messages(): array
    {
        return [
            'required'    => 'El campo :attribute es obligatorio.',
            'unique'      => 'Ya existe un bloque con esa :attribute en la cancha seleccionada.',
            'date_format' => 'El campo :attribute no tiene un formato de hora válido.',
            'after'       => 'La :attribute debe ser posterior a la hora de inicio.',
            'integer'     => 'El campo :attribute debe ser un número entero.',
            'exists'      => 'La :attribute seleccionada no existe o está inactiva.',
        ];
    }
}