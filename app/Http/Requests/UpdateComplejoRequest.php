<?php

namespace App\Http\Requests;

use App\Models\Complejo;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateComplejoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $complejoId = $this->route('complejo')?->id ?? $this->route('complejo');
        return [
            'nombre'        => ['required', 'string', 'max:100'],
            'direccion'     => ['required', 'string', 'max:100', Rule::unique('complejos', 'direccion')->ignore($complejoId)],
            'latitud'       => ['required', 'numeric', 'between:-90,90'],
            'longitud'      => ['required', 'numeric', 'between:-180,180'],
            'precio_base'   => ['required', 'numeric', 'min:0'],
            'tipo_piso'     => ['required', 'string', Rule::in(Complejo::TIPOS_PISO)],
            'imagen'        => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
        ];
    }

    public function attributes():array
    {
        return [
            'nombre' => 'nombre',
            'direccion' => 'direccion',
            'latitud' => 'latitud',
            'longitud' => 'longitud',
            'precio_base' => 'precio base',
            'tipo_piso' => 'tipo de piso',
            'activo' => 'activo',
        ];
    }

    public function messages():array
    {
        return [
            'required' => 'El campo :attribute es obligatorio.',
            'unique'   => 'El campo :attribute ingresado ya se encuentra registrado.',
            'max'      => 'El campo :attribute no debe superar los :max caracteres.',
            'min'      => 'El campo :attribute no debe ser menor a :min.',
            'between'  => 'El campo :attribute debe estar entre :min y :max.',
            'exists'   => 'El :attribute seleccionado no existe.',
            'in'       => 'El :attribute seleccionado no es válido.',
            'image'    => 'El archivo debe ser una imagen válida.',
        ];
    }
}
