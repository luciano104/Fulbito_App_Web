@extends('emails.layout')

@section('header', $data['activo'] ? 'Complejo Reactivado' : 'Aviso de Suspensión de Complejo')

@section('content')
    <p style="margin-top: 0; margin-bottom: 16px; font-size: 17px; color: #111827;">
        Estimad@ <strong>{{ $data['admin_nombre'] }}</strong>,
    </p>
    <p style="margin-top: 0; margin-bottom: 24px; color: #4b5563;">
        Te informamos que el estado administrativo de tu complejo en <strong>Fulbito App</strong> ha sido actualizado por la administración de la plataforma:
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 6px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
        <tr>
            <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Complejo</p>
                <p style="margin: 0; font-size: 16px; color: #0f172a; font-weight: 600;">{{ $data['complejo_nombre'] }}</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 16px 20px;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Nuevo Estado</p>
                <p style="margin: 0; font-size: 16px; font-weight: 700; color: {{ $data['activo'] ? '#15803d' : '#b91c1c' }};">
                    {{ $data['activo'] ? 'ACTIVO (Visible y operando)' : 'SUSPENDIDO (Oculto para nuevas reservas)' }}
                </p>
            </td>
        </tr>
    </table>

    @if(!$data['activo'])
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
        <tr>
            <td style="padding: 16px;">
                <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 500;">
                    ⚠️ <strong>Atención:</strong> Mientras el complejo permanezca suspendido, sus canchas no estarán disponibles para reservas en la aplicación móvil. Comunícate con soporte administrativo para regularizar la situación.
                </p>
            </td>
        </tr>
    </table>
    @else
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 4px;">
        <tr>
            <td style="padding: 16px;">
                <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 500;">
                    ✅ Tu complejo vuelve a estar operativo y disponible para recibir reservas de los jugadores.
                </p>
            </td>
        </tr>
    </table>
    @endif
@endsection