@php
    $estado = $data['estado'];
    $estilos = match ($estado) {
        'confirmada' => ['bg' => '#ecfdf5', 'border' => '#10b981', 'text' => '#065f46'],
        'cancelada'  => ['bg' => '#fef2f2', 'border' => '#ef4444', 'text' => '#991b1b'],
        default      => ['bg' => '#fffbeb', 'border' => '#f59e0b', 'text' => '#92400e'],
    };
@endphp

<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
    <p style="margin-top: 0; margin-bottom: 16px; font-size: 17px;">
        Estimad@ <strong>{{ $data['jugador_nombre'] }}</strong>,
    </p>

    <p style="margin-top: 0; margin-bottom: 20px; color: #4b5563;">
        @if($estado === 'pendiente')
            Hemos recibido tu solicitud de reserva en <strong>{{ $data['complejo_nombre'] }}</strong> con los siguientes detalles:
        @else
            Te informamos que el estado de tu reserva en <strong>{{ $data['complejo_nombre'] }}</strong> ha sido actualizado:
        @endif
    </p>

    <!-- Estado destacado -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
        style="background-color: {{ $estilos['bg'] }}; border-left: 4px solid {{ $estilos['border'] }}; border-radius: 4px; margin-bottom: 20px;">
        <tr>
            <td style="padding: 14px 16px;">
                <p style="margin: 0; color: {{ $estilos['text'] }}; font-size: 15px; font-weight: 600;">
                    Estado de la Reserva #{{ $data['reserva_id'] }}: {{ strtoupper($estado) }}
                </p>
            </td>
        </tr>
    </table>

    <!-- Detalles del turno -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
        style="background-color: #f8fafc; border-radius: 6px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
        <tr>
            <td style="padding: 16px 20px;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Complejo</p>
                <p style="margin: 0 0 12px 0; font-size: 15px; color: #0f172a; font-weight: 500;">{{ $data['complejo_nombre'] }}</p>

                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Cancha</p>
                <p style="margin: 0 0 12px 0; font-size: 15px; color: #0f172a; font-weight: 500;">{{ $data['cancha_nombre'] }}</p>

                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600;">Fecha y Horario</p>
                <p style="margin: 0; font-size: 15px; color: #0f172a; font-weight: 500;">
                    {{ $data['fecha'] }} de {{ $data['horario'] }} hs
                </p>
            </td>
        </tr>
    </table>

    @if($estado === 'confirmada')
        <p style="margin: 0; font-size: 14px; color: #4b5563;">
            ¡Te esperamos! Recordá presentarte unos minutos antes del inicio del turno.
        </p>
    @elseif($estado === 'pendiente')
        <p style="margin: 0; font-size: 14px; color: #4b5563;">
            Tu turno quedó registrado como <strong>pendiente</strong>. Te notificaremos por este medio cuando el complejo lo confirme.
        </p>
    @else
        <p style="margin: 0; font-size: 14px; color: #4b5563;">
            Si tenés alguna consulta sobre esta cancelación, comunicate con el complejo.
        </p>
    @endif
</div>