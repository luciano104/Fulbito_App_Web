<?php

namespace App\Http\Controllers;

use App\Models\Complejo;
use App\Models\Reserva;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    // ==========================================
    // REPORTES DUEÑO
    // ==========================================
    private function obtenerDatosDuenio(Request $request): array
    {
        if ($request->filled('fecha_inicio') && $request->filled('fecha_fin')) {
            $request->validate([
                'fecha_inicio' => ['date'],
                'fecha_fin'    => ['date', 'after_or_equal:fecha_inicio'],
            ], [
                'fecha_fin.after_or_equal' => 'La fecha fin no puede ser anterior a la fecha inicio.',
            ]);
        }

        $user = Auth::user();
        $complejo = Complejo::where('admin_id', $user->id)->firstOrFail();

        $fechaInicio   = trim((string) $request->input('fecha_inicio', ''));
        $fechaFin      = trim((string) $request->input('fecha_fin', ''));
        $canchaId      = (string) $request->input('cancha_id', '');
        $horarioInicio = (string) $request->input('horario_inicio', '');
        $estado        = (string) $request->input('estado', '');
        $tipoResenia   = (string) $request->input('tipo_resenia', '');

        $reservas = Reserva::whereHas('horario.cancha', function ($q) use ($complejo, $canchaId) {
            $q->where('complejo_id', $complejo->id)->where('activo', true);
            if ($canchaId !== '') {
                $q->where('id', $canchaId);
            }
        })
            ->when($fechaInicio !== '', fn ($q) => $q->whereDate('fecha', '>=', $fechaInicio))
            ->when($fechaFin !== '', fn ($q) => $q->whereDate('fecha', '<=', $fechaFin))
            ->when($horarioInicio !== '', fn ($q) => $q->whereHas('horario', fn ($h) => $h->where('start_time', $horarioInicio)))
            ->when($estado !== '', fn ($q) => $q->where('estado', $estado))
            ->when($tipoResenia === 'positivas', fn ($q) => $q->whereHas('resenia', fn ($r) => $r->where('activo', true)->where('calificacion', '>=', 4)))
            ->when($tipoResenia === 'negativas', fn ($q) => $q->whereHas('resenia', fn ($r) => $r->where('activo', true)->where('calificacion', '<=', 3)))
            ->with(['jugador:id,name,email', 'horario.cancha', 'resenia'])
            ->orderBy('fecha', 'desc')
            ->get();

        $totalRecaudado = $reservas->whereIn('estado', ['confirmada', 'completada'])
            ->sum(fn ($r) => ($r->precio_historico > 0) ? $r->precio_historico : ($r->horario?->cancha?->precio ?? 0));

        $etiquetaPeriodo = ($fechaInicio !== '' || $fechaFin !== '')
            ? ($fechaInicio ?: 'Inicio') . ' al ' . ($fechaFin ?: 'Actualidad')
            : 'Histórico completo';

        return compact('complejo', 'reservas', 'totalRecaudado', 'fechaInicio', 'fechaFin', 'etiquetaPeriodo', 'estado', 'tipoResenia');
    }

    public function duenioPdf(Request $request)
    {
        $datos = $this->obtenerDatosDuenio($request);
        $datos['fechaInicio'] = $datos['fechaInicio'] ?: 'historico';
        $datos['fechaFin']    = $datos['fechaFin'] ?: 'completo';

        $pdf = Pdf::loadView('reportes.duenio_pdf', $datos)->setPaper('a4', 'landscape');
        return $pdf->download("reporte_{$datos['complejo']->nombre}_{$datos['fechaInicio']}.pdf");
    }

    public function duenioExcel(Request $request): StreamedResponse
    {
        $datos = $this->obtenerDatosDuenio($request);
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Reporte Complejo');

        $sheet->mergeCells('A1:G1');
        $sheet->setCellValue('A1', "REPORTE DE GESTIÓN - {$datos['complejo']->nombre}");
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14)->getColor()->setARGB('FFFFFFFF');
        $sheet->getStyle('A1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF1E293B');
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getRowDimension(1)->setRowHeight(28);

        $sheet->mergeCells('A2:G2');
        $sheet->setCellValue('A2', "Período: {$datos['etiquetaPeriodo']} | Total Recaudado: $" . number_format($datos['totalRecaudado'], 2));
        $sheet->getStyle('A2')->getFont()->setItalic(true)->setSize(10);

        $headers = ['Fecha', 'Horario', 'Cancha', 'Cliente / Jugador', 'Estado', 'Monto ($)', 'Reseña'];
        $sheet->fromArray($headers, null, 'A4');
        $sheet->getStyle('A4:G4')->applyFromArray([
            'font'      => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF4F46E5']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        $row = 5;
        foreach ($datos['reservas'] as $res) {
            $cliente = $res->jugador?->name ?? $res->nya_jugador ?? 'Sin asignar';
            $horario = $res->horario ? "{$res->horario->start_time} - {$res->horario->end_time}" : '-';
            $cancha  = $res->horario?->cancha?->nombre ?? '-';
            $precioTurno = ($res->precio_historico > 0) ? $res->precio_historico : ($res->horario?->cancha?->precio ?? 0);
            $monto   = in_array($res->estado, ['confirmada', 'completada']) ? $precioTurno : 0;
            $calif   = $res->resenia ? "{$res->resenia->calificacion}/5 ★" : 'Sin reseña';

            $sheet->fromArray([$res->fecha->format('Y-m-d'), $horario, $cancha, $cliente, ucfirst($res->estado), $monto, $calif], null, "A{$row}");
            if ($row % 2 === 0) {
                $sheet->getStyle("A{$row}:G{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFF8FAFC');
            }
            $row++;
        }

        $sheet->setCellValue("E{$row}", 'TOTAL RECAUDADO:');
        $sheet->setCellValue("F{$row}", $datos['totalRecaudado']);
        $sheet->getStyle("E{$row}:F{$row}")->getFont()->setBold(true);
        $sheet->getStyle("A4:G{$row}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

        foreach (range('A', 'G') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $sufijo = $datos['fechaInicio'] ?: 'historico';
        $writer = new Xlsx($spreadsheet);
        return response()->streamDownload(fn () => $writer->save('php://output'), "reporte_complejo_{$sufijo}.xlsx");
    }

    // ==========================================
    // REPORTES SUPERADMIN (Complejos y Pagos SaaS)
    // ==========================================
    private function obtenerDatosSuperadmin(Request $request): array
    {
        $complejoId  = (string) $request->input('complejo_id', '');
        $estado      = (string) $request->input('estado', '');
        $fechaInicio = (string) $request->input('fecha_inicio', '');
        $fechaFin    = (string) $request->input('fecha_fin', '');

        $complejos = Complejo::with('admin:id,name,email')
            ->when($complejoId !== '', fn ($q) => $q->where('id', $complejoId))
            ->when($estado === 'activos', fn ($q) => $q->where('activo', true))
            ->when($estado === 'inactivos', fn ($q) => $q->where('activo', false))
            ->when($fechaInicio !== '', fn ($q) => $q->whereDate('created_at', '>=', $fechaInicio))
            ->when($fechaFin !== '', fn ($q) => $q->whereDate('created_at', '<=', $fechaFin))
            ->get();

        return compact('complejos', 'fechaInicio', 'fechaFin', 'estado');
    }

    public function superadminPdf(Request $request)
    {
        $datos = $this->obtenerDatosSuperadmin($request);
        $pdf = Pdf::loadView('reportes.superadmin_pdf', $datos)->setPaper('a4', 'landscape');
        return $pdf->download('reporte_clientes_saas.pdf');
    }

    public function superadminExcel(Request $request): StreamedResponse
    {
        $datos = $this->obtenerDatosSuperadmin($request);
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Clientes SaaS');

        $sheet->mergeCells('A1:F1');
        $sheet->setCellValue('A1', 'REPORTE DE COMPLEJOS CLIENTES - PLATAFORMA SAAS');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14)->getColor()->setARGB('FFFFFFFF');
        $sheet->getStyle('A1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF0F172A');

        $headers = ['ID', 'Complejo', 'Dirección', 'Dueño Titular', 'Email Contacto', 'Estado'];
        $sheet->fromArray($headers, null, 'A3');
        $sheet->getStyle('A3:F3')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF059669']],
        ]);

        $row = 4;
        foreach ($datos['complejos'] as $c) {
            $sheet->fromArray([
                $c->id,
                $c->nombre,
                $c->direccion,
                $c->admin?->name ?? '-',
                $c->admin?->email ?? '-',
                $c->activo ? 'Activo' : 'Suspendido',
            ], null, "A{$row}");
            $row++;
        }

        $sheet->getStyle('A3:F' . ($row - 1))->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        foreach (range('A', 'F') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        return response()->streamDownload(fn () => $writer->save('php://output'), 'reporte_clientes_saas.xlsx');
    }
}