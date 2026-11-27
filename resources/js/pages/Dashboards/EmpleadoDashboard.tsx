import { Head, Link } from '@inertiajs/react';
import {
    Calendar,
    Clock,
    CheckCircle2,
    DollarSign,
    Plus,
    AlertCircle,
    Building2,
    TrendingUp,
    Wallet
} from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface ReservaHoy {
    id: number;
    fecha: string;
    estado: string;
    nya_jugador?: string | null;
    jugador?: { name: string; email: string } | null;
    horario?: {
        start_time: string;
        end_time: string;
        cancha?: { nombre: string; tamanio: string; tipo_piso: string; precio: number };
    };
}

interface ResumenCancha {
    id: number;
    nombre: string;
    tamanio: string;
    turnos_cobrados: number;
    turnos_pendientes: number;
    subtotal_cobrado: number;
    subtotal_pendiente: number;
}

interface EmpleadoDashboardProps {
    complejo?: { id: number; nombre: string } | null;
    fechaHoy?: string;
    metricsHoy?: {
        total_reservas_hoy: number;
        confirmadas_hoy: number;
        pendientes_hoy: number;
        canceladas_hoy: number;
        recaudacion_cobrada_hoy: number;
        monto_pendiente_cobro: number;
        promedio_diario_historico: number;
        ocupacion_hoy_porcentaje: number;
    };
    resumenPorCancha?: ResumenCancha[];
    reservasHoy?: ReservaHoy[];
}

export default function EmpleadoDashboard({
    complejo,
    fechaHoy = new Date().toISOString().split('T')[0],
    metricsHoy = {
        total_reservas_hoy: 0,
        confirmadas_hoy: 0,
        pendientes_hoy: 0,
        canceladas_hoy: 0,
        recaudacion_cobrada_hoy: 0,
        monto_pendiente_cobro: 0,
        promedio_diario_historico: 0,
        ocupacion_hoy_porcentaje: 0,
    },
    resumenPorCancha = [],
    reservasHoy = []
}: EmpleadoDashboardProps) {

    const diferenciaVsPromedio = metricsHoy.recaudacion_cobrada_hoy - metricsHoy.promedio_diario_historico;

    const renderBadgeEstado = (est: string) => {
        switch (est) {
            case 'confirmada':
                return <Badge className="bg-emerald-600 text-white">Confirmada / Cobrada</Badge>;
            case 'completada':
                return <Badge className="bg-blue-600 text-white">Completada</Badge>;
            case 'pendiente':
                return <Badge className="bg-yellow-500 text-black font-semibold">Pendiente de Cobro</Badge>;
            case 'cancelada':
                return <Badge className="bg-red-600 text-white">Cancelada</Badge>;
            default:
                return <Badge variant="outline">{est}</Badge>;
        }
    };

    return (
        <>
            <Head title={`Cierre Diario - ${complejo?.nombre ?? 'Empleado'}`} />

            <div className="flex-1 space-y-6 p-8 pt-6">
                {/* Encabezado */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Wallet className="h-8 w-8 text-emerald-500" />
                            Resumen Diario y Cierre de Caja ({fechaHoy})
                        </h2>
                        <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
                            {complejo ? (
                                <>
                                    <Building2 className="h-4 w-4" />
                                    Complejo: <span className="font-semibold text-foreground">{complejo.nombre}</span> — Control de efectivo, turnos pendientes y rendimiento del día.
                                </>
                            ) : (
                                'Aún no tienes un complejo asignado. Contacta al dueño.'
                            )}
                        </p>
                    </div>
                    {complejo && (
                        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Link href="/reservas/create">
                                <Plus className="w-4 h-4 mr-2" />
                                Nueva Reserva Presencial
                            </Link>
                        </Button>
                    )}
                </div>

                {/* KPIs Clave para Cierre de Caja */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-emerald-500/40">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total en Caja (Cobrado)</CardTitle>
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-400">
                                ${metricsHoy.recaudacion_cobrada_hoy.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                De {metricsHoy.confirmadas_hoy} turnos confirmados/completados
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-yellow-500/40">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Saldo Pendiente de Cobro</CardTitle>
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-400">
                                ${metricsHoy.monto_pendiente_cobro.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {metricsHoy.pendientes_hoy} turnos pendientes por cobrar o cancelar
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rendimiento vs. Promedio</CardTitle>
                            <TrendingUp className="h-4 w-4 text-indigo-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {diferenciaVsPromedio >= 0 ? '+' : ''}${diferenciaVsPromedio.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Promedio diario: ${metricsHoy.promedio_diario_historico.toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ocupación del Día</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metricsHoy.ocupacion_hoy_porcentaje}%</div>
                            <p className="text-xs text-muted-foreground">
                                {metricsHoy.total_reservas_hoy} turnos totales ({metricsHoy.canceladas_hoy} cancelados)
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Desglose por Cancha para Arqueo Rápido */}
                <Card>
                    <CardHeader>
                        <CardTitle>Arqueo de Caja por Cancha</CardTitle>
                        <CardDescription>
                            Detalle de ingresos cobrados y pendientes discriminados por cada cancha del complejo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cancha</TableHead>
                                    <TableHead className="text-center">Turnos Cobrados</TableHead>
                                    <TableHead className="text-center">Turnos Pendientes</TableHead>
                                    <TableHead className="text-right">Pendiente ($)</TableHead>
                                    <TableHead className="text-right">Cobrado en Caja ($)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {resumenPorCancha.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-semibold">
                                            {c.nombre} <span className="text-xs font-normal text-muted-foreground">({c.tamanio})</span>
                                        </TableCell>
                                        <TableCell className="text-center">{c.turnos_cobrados}</TableCell>
                                        <TableCell className="text-center">{c.turnos_pendientes}</TableCell>
                                        <TableCell className="text-right text-yellow-400">
                                            ${c.subtotal_pendiente.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-emerald-400">
                                            ${c.subtotal_cobrado.toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Planilla Operativa de Turnos del Día */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Planilla de Turnos de Hoy
                        </CardTitle>
                        <CardDescription>
                            Verifica que todos los turnos jugados figuren como Confirmados/Completados antes de cerrar la caja.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Horario</TableHead>
                                    <TableHead>Cancha</TableHead>
                                    <TableHead>Jugador / Cliente</TableHead>
                                    <TableHead>Valor Turno</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Gestión</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reservasHoy.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No hay reservas programadas para hoy.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reservasHoy.map((reserva) => (
                                        <TableRow key={reserva.id}>
                                            <TableCell className="font-bold">
                                                <Clock className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                                {reserva.horario ? `${reserva.horario.start_time} - ${reserva.horario.end_time}` : 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-semibold">{reserva.horario?.cancha?.nombre}</span>
                                                <span className="text-xs text-muted-foreground ml-1">
                                                    ({reserva.horario?.cancha?.tamanio})
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {reserva.jugador?.name ?? reserva.nya_jugador ?? 'Sin asignar'}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {reserva.jugador?.email ?? (reserva.nya_jugador ? 'Reserva presencial' : '')}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                ${(reserva.horario?.cancha?.precio ?? 0).toLocaleString()}
                                            </TableCell>
                                            <TableCell>{renderBadgeEstado(reserva.estado)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/reservas/${reserva.id}/edit`}>Actualizar Estado</Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}