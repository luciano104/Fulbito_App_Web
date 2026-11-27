<?php

namespace App\Http\Requests;

use App\Models\Cancha;
use App\Models\Complejo;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCanchaRequest extends FormRequest
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
        $cancha = $this->route('cancha');

        return [
            'nombre' => [
                'required',
                'string',
                'max:100',
                Rule::unique('canchas', 'nombre')
                    ->where(fn($q) => $q->where('complejo_id', $cancha->complejo_id)->where('activo', true))
                    ->ignore($cancha->id),
            ],
            'tamanio' => ['required', 'string', Rule::in(Cancha::TIPOS_CANCHA)],
            'tipo_piso' => ['required', 'string', 'in:sintetico,natural,parquet,cemento,tierra'],
            'precio' => ['required', 'numeric', 'min:0'],
            'disponible' => ['boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'nombre' => 'nombre de la cancha',
            'tamanio' => 'tamaño',
            'tipo_piso' => 'tipo de piso',
            'precio' => 'precio',
            'disponible' => 'disponibilidad',
            'complejo_id' => 'complejo',
        ];
    }

    public function messages(): array
    {
        return [
            'required' => 'El campo :attribute es obligatorio.',
            'unique' => 'Ya existe una cancha con ese :attribute en el complejo seleccionado.',
            'max' => 'El campo :attribute no debe superar los :max caracteres.',
            'min' => 'El campo :attribute no debe ser menor a :min.',
            'exists' => 'El :attribute seleccionado no existe o está inactivo.',
            'in' => 'El :attribute seleccionado no es válido.',
            'boolean' => 'El campo :attribute debe ser verdadero o falso.',
        ];
    }
}