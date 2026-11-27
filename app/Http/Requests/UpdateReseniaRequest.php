<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateReseniaRequest extends FormRequest
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
        return [
            'calificacion' => ['sometimes', 'required', 'integer', 'between:1,5'],
            'comentario'   => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function attributes(): array
    {
        return [
            'calificacion' => 'calificación',
            'comentario'   => 'comentario',
        ];
    }

    public function messages(): array
    {
        return [
            'required' => 'El campo :attribute es obligatorio.',
            'integer'  => 'El campo :attribute debe ser un número entero.',
            'between'  => 'La :attribute debe estar entre :min y :max estrellas.',
            'max'      => 'El campo :attribute no debe superar los :max caracteres.',
        ];
    }
}