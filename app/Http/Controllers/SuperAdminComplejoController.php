<?php

namespace App\Http\Controllers;

use App\Mail\EstadoComplejoMail;
use App\Models\Complejo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;

class SuperAdminComplejoController extends Controller
{
    public function toggleActivo(Complejo $complejo): RedirectResponse
    {
        if (!Auth::user()->hasAnyRole(['super-admin'])) {
            abort(403, 'No autorizado.');
        }

        $complejo->activo = !$complejo->activo;
        $complejo->save();

        // Enviar notificación por correo al dueño del complejo
        $complejo->load('admin');
        if ($complejo->admin && $complejo->admin->email) {
            Mail::to($complejo->admin->email)->send(new EstadoComplejoMail([
                'admin_nombre'    => $complejo->admin->name,
                'complejo_nombre' => $complejo->nombre,
                'activo'          => $complejo->activo,
            ]));
        }

        $mensaje = $complejo->activo
            ? "El complejo '{$complejo->nombre}' ha sido reactivado."
            : "El complejo '{$complejo->nombre}' ha sido suspendido.";

        return back()->with('success', $mensaje);
    }
}