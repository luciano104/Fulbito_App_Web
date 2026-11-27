<?php

namespace App\Http\Requests;

use App\Models\Complejo;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreComplejoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('super-admin') ?? false;
    }

    public function rules(): array
    {
        return [
            'nombre'        => ['required', 'string', 'max:100'],
            'direccion'     => ['required', 'string', 'max:100', 'unique:complejos,direccion'],
            'latitud'       => ['required', 'numeric', 'between:-90,90'],
            'longitud'      => ['required', 'numeric', 'between:-180,180'],
            'precio_base'   => ['required', 'numeric', 'min:0'],
            'tipo_piso'     => ['required', 'string', Rule::in(Complejo::TIPOS_PISO)],
            'avg_rating'    => ['nullable', 'numeric', 'between:0,5'],
            'total_reviews' => ['nullable', 'integer', 'min:0'],
            'imagen'        => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
            'admin_id'      => ['nullable', 'integer', Rule::exists('users', 'id')],
            'admin_email'   => ['required_without:admin_id', 'nullable', 'email', 'max:255', 'unique:users,email'],
        ];
    }

    public function attributes(): array
    {
        return [
            'nombre'        => 'nombre',
            'direccion'     => 'dirección',
            'latitud'       => 'latitud',
            'longitud'      => 'longitud',
            'precio_base'   => 'precio base',
            'tipo_piso'     => 'tipo de piso',
            'avg_rating'    => 'calificación promedio',
            'total_reviews' => 'total de reseñas',
            'admin_id'      => 'administrador',
            'admin_email'   => 'correo electrónico del dueño',
        ];
    }

    public function messages(): array
    {
        return [
            'required'         => 'El campo :attribute es obligatorio.',
            'required_without' => 'El campo :attribute es obligatorio cuando no seleccionas un dueño existente.',
            'unique'           => 'El :attribute ingresado ya se encuentra registrado en el sistema.',
            'email'            => 'Debes ingresar un :attribute válido.',
            'max'              => 'El campo :attribute no debe superar los :max caracteres.',
            'min'              => 'El campo :attribute no debe ser menor a :min.',
            'between'          => 'El campo :attribute debe estar entre :min y :max.',
            'exists'           => 'El :attribute seleccionado no existe.',
            'in'               => 'El :attribute seleccionado no es válido.',
            'image'            => 'El archivo debe ser una imagen válida.',
        ];
    }
}