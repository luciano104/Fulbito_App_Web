@extends('emails.layout')

@section('header', 'Gestión de Cuenta y Credenciales')

@section('content')
    <p style="margin-top: 0; margin-bottom: 16px; font-size: 17px; color: #111827;">
        Estimad@ <strong>{{ $data['user_nombre'] }}</strong>,
    </p>
    <p style="margin-top: 0; margin-bottom: 24px; color: #4b5563;">
        {{ $data['mensaje_intro'] }}
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 6px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
        <tr>
            <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Nombre</p>
                <p style="margin: 0; font-size: 16px; color: #0f172a; font-weight: 500;">{{ $data['user_nombre'] }}</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Correo Electrónico</p>
                <p style="margin: 0; font-size: 16px; color: #0f172a; font-weight: 500;">{{ $data['user_email'] }}</p>
            </td>
        </tr>
        @if(!empty($data['user_password']))
        <tr>
            <td style="padding: 16px 20px;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Contraseña</p>
                <p style="margin: 0; font-size: 16px; color: #0f172a; font-weight: 600;">{{ $data['user_password'] }}</p>
            </td>
        </tr>
        @endif
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
        <tr>
            <td style="padding: 16px;">
                <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 500;">
                    ⚠️ <strong>Importante:</strong> Si no has solicitado esta acción o no reconoces estos datos, contacta de inmediato con el administrador del sistema.
                </p>
            </td>
        </tr>
    </table>
@endsection