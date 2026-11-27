<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #0f172a; }
        .header { background-color: #0f172a; color: #ffffff; padding: 16px; border-radius: 6px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th { background-color: #059669; color: #ffffff; text-align: left; padding: 8px; }
        td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) { background-color: #f8fafc; }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin:0; font-size:18px;">Reporte de Complejos Clientes (SaaS)</h1>
        <p style="margin:4px 0 0; color:#cbd5e1;">Emisión: {{ date('d/m/Y H:i') }} | Total registros: {{ $complejos->count() }}</p>
    </div>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Complejo</th>
                <th>Dirección</th>
                <th>Dueño</th>
                <th>Email</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            @foreach($complejos as $c)
            <tr>
                <td>#{{ $c->id }}</td>
                <td>{{ $c->nombre }}</td>
                <td>{{ $c->direccion }}</td>
                <td>{{ $c->admin?->name ?? '-' }}</td>
                <td>{{ $c->admin?->email ?? '-' }}</td>
                <td>{{ $c->activo ? 'Activo' : 'Suspendido' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>