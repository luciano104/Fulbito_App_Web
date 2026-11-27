<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1e293b; }
        .header { background-color: #1e293b; color: #ffffff; padding: 16px; border-radius: 6px; margin-bottom: 16px; }
        .header h1 { margin: 0; font-size: 18px; }
        .header p { margin: 4px 0 0; font-size: 11px; color: #cbd5e1; }
        .summary { background: #f1f5f9; padding: 10px 14px; border-left: 4px solid #4f46e5; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background-color: #4f46e5; color: #ffffff; text-align: left; padding: 8px; font-size: 10px; text-transform: uppercase; }
        td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .badge { padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; color: #fff; }
        .confirmada { background: #10b981; }
        .completada { background: #3b82f6; }
        .pendiente { background: #eab308; color: #000; }
        .cancelada { background: #ef4444; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $complejo->nombre }} — Reporte Analítico de Operaciones</h1>
        <p>Período consultado: {{ $fechaInicio }} al {{ $fechaFin }} | Generado el {{ date('d/m/Y H:i') }}</p>
    </div>
    <div class="summary">
        <strong>Total de Reservas Listadas:</strong> {{ $reservas->count() }} &nbsp;&nbsp;|&nbsp;&nbsp;
        <strong>Recaudación Efectiva (Confirmadas/Completadas):</strong> ${{ number_format($totalRecaudado, 2) }}
    </div>
    <table>
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Cancha</th>
                <th>Jugador / Cliente</th>
                <th>Estado</th>
                <th>Monto</th>
                <th>Reseña</th>
            </tr>
        </thead>
        <tbody>
            @foreach($reservas as $res)
            <tr>
                <td>{{ $res->fecha }}</td>
                <td>{{ $res->horario ? $res->horario->start_time . ' - ' . $res->horario->end_time : '-' }}</td>
                <td>{{ $res->horario?->cancha?->nombre ?? '-' }}</td>
                <td>{{ $res->jugador?->name ?? $res->nya_jugador ?? 'Sin asignar' }}</td>
                <td><span class="badge {{ $res->estado }}">{{ ucfirst($res->estado) }}</span></td>
                <td>${{ number_format(in_array($res->estado, ['confirmada', 'completada']) ? ($res->horario?->cancha?->precio ?? 0) : 0, 2) }}</td>
                <td>{{ $res->resenia ? $res->resenia->calificacion . '/5 ★' : '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>