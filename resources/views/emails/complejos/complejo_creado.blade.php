@extends('emails.layout')

@section('header', 'Alta de Complejo y Credenciales')

@section('content')
    <p style="margin-top: 0; margin-bottom: 16px; font-size: 17px; color: #111827;">
        Estimad@ <strong>{{ $data['admin_nombre'] }}</strong>,
    </p>
    <p style="margin-top: 0; margin-bottom: 24px; color: #4b5563;">
        Tu complejo deportivo ha sido dado de alta exitosamente en la plataforma. A continuación te detallamos la información registrada y tus credenciales de acceso:
    </p>

    <!-- Datos del Complejo -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 6px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
        <tr>
            <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Complejo</p>
                <p style="margin: 0; font-size: 16px; color: #0f172a; font-weight: 600;">{{ $data['complejo_nombre'] }}</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 12px 20px; border-bottom: 1px solid #e2e8f0;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Dirección y Coordenadas</p>
                <p style="margin: 0; font-size: 15px; color: #0f172a;">{{ $data['complejo_direccion'] }} ({{ $data['complejo_latitud'] }}, {{ $data['complejo_longitud'] }})</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 12px 20px;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Precio Base y Tipo de Piso</p>
                <p style="margin: 0; font-size: 15px; color: #0f172a;">${{ number_format($data['complejo_precio_base'], 2, ',', '.') }} — {{ ucfirst($data['complejo_tipo_piso']) }}</p>
            </td>
        </tr>
    </table>

    <!-- Credenciales de Acceso -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #eff6ff; border-radius: 6px; margin-bottom: 24px; border: 1px solid #bfdbfe;">
        <tr>
            <td style="padding: 16px 20px; border-bottom: 1px solid #bfdbfe;">
                <p style="margin: 0 0 6px 0; font-size: 13px; color: #1e40af; text-transform: uppercase; font-weight: 700;">Tu Cuenta de Administrador (Dueño)</p>
                <p style="margin: 0; font-size: 15px; color: #1e3a8a;"><strong>Email:</strong> {{ $data['admin_email'] }}</p>
                <p style="margin: 4px 0 0 0; font-size: 15px; color: #1e3a8a;"><strong>Contraseña temporal:</strong> {{ $data['admin_password'] }}</p>
            </td>
        </tr>
        @if(!empty($data['empleado_email']))
        <tr>
            <td style="padding: 16px 20px;">
                <p style="margin: 0 0 6px 0; font-size: 13px; color: #1e40af; text-transform: uppercase; font-weight: 700;">Cuenta de Empleado Generada</p>
                <p style="margin: 0; font-size: 15px; color: #1e3a8a;"><strong>Email:</strong> {{ $data['empleado_email'] }}</p>
                <p style="margin: 4px 0 0 0; font-size: 15px; color: #1e3a8a;"><strong>Contraseña temporal:</strong> {{ $data['empleado_password'] }}</p>
            </td>
        </tr>
        @endif
    </table>

    <!-- Alerta de seguridad -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
        <tr>
            <td style="padding: 16px;">
                <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 500;">
                    ⚠️ <strong>Importante:</strong> Por seguridad, recuerda cambiar tu contraseña por defecto y actualizar los datos de tu empleado al ingresar por primera vez al panel web.
                </p>
            </td>
        </tr>
    </table>
@endsection