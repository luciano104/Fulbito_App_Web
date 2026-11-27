import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    DollarSign,
    Trophy,
    CalendarCheck,
    TrendingUp,
    ArrowUpRight,
    Building2,
    Filter,
    FileSpreadsheet,
    FileText,
    Star,
    RotateCcw,
    AlertTriangle
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

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

interface Cancha {
    id: number;
    nombre: string;
    tamanio: string;
    tipo_piso: string;
    precio: number;
    reservas_count?: number;
}

interface ReservaFiltrada {
    id: number;
    fecha: string;
    estado: string;
    precio_historico?: number;
    nya_jugador?: string | null;
    jugador?: { name: string; email: string } | null;
    horario?: { start_time: string; end_time: string; cancha?: Cancha };
    resenia?: { calificacion: number; comentario?: string } | null;
}

interface ReseniaItem {
    id: number;
    calificacion: number;
    comentario?: string;
    publicado_en: string;
    reserva?: {
        jugador?: { name: string };
        horario?: { cancha?: { nombre: string } };
    };
}

interface DistribucionEstado {
    name: string;
    value: number;
    fill?: string;
}

interface DuenioDashboardProps {
    complejo?: { id: number; nombre: string; direccion: string } | null;
    metrics?: {
        total_recaudado: number;
        total_canchas: number;
        total_reservas: number;
        porcentaje_ocupacion: number;
        promedio_resenia: number;
    };
    ingresosMensuales?: { mes: string; monto: number }[];
    distribucionEstados?: DistribucionEstado[];
    canchas?: Cancha[];
    horariosDisponibles?: { start_time: string; end_time: string }[];
    reservasFiltradas?: ReservaFiltrada[];
    reseniasFiltradas?: ReseniaItem[];
    filters?: {
        fecha_inicio?: string;
        fecha_fin?: string;
        cancha_id?: string;
        horario_inicio?: string;
        estado?: string;
        tipo_resenia?: string;
    };
}

const STATUS_COLOR_MAP: Record<string, string> = {
    Confirmada: '#10b981',
    Completada: '#3b82f6',
    Pendiente: '#eab308',
    Cancelada: '#ef4444',
};

export default function DuenioDashboard({
    complejo,
    metrics = { total_recaudado: 0, total_canchas: 0, total_reservas: 0, porcentaje_ocupacion: 0, promedio_resenia: 0 },
    ingresosMensuales = [],
    distribucionEstados = [],
    canchas = [],
    horariosDisponibles = [],
    reservasFiltradas = [],
    reseniasFiltradas = [],
    filters = {}
}: DuenioDashboardProps) {
    const [formFilters, setFormFilters] = useState({
        fecha_inicio: filters.fecha_inicio ?? '',
        fecha_fin: filters.fecha_fin ?? '',
        cancha_id: filters.cancha_id ?? '',
        horario_inicio: filters.horario_inicio ?? '',
        estado: filters.estado ?? '',
        tipo_resenia: filters.tipo_resenia ?? '',
    });

    const [dateError, setDateError] = useState<string>('');

    const rangoFechasInvalido =
        Boolean(formFilters.fecha_inicio && formFilters.fecha_fin) &&
        formFilters.fecha_fin < formFilters.fecha_inicio;

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (rangoFechasInvalido) {
            setDateError('La fecha fin no puede ser anterior a la fecha inicio.');
            return;
        }

        setDateError('');
        router.get('/dashboard', formFilters, { preserveState: true, preserveScroll: true });
    };

    const handleResetFilters = () => {
        const empty = { fecha_inicio: '', fecha_fin: '', cancha_id: '', horario_inicio: '', estado: '', tipo_resenia: '' };
        setFormFilters(empty);
        setDateError('');
        router.get('/dashboard', {}, { preserveState: true });
    };

    const buildQueryString = () => {
        const params = new URLSearchParams();
        Object.entries(formFilters).forEach(([k, v]) => {
            if (v) params.append(k, String(v));
        });
        return params.toString();
    };

    const renderBadgeEstado = (est: string) => {
        switch (est) {
            case 'confirmada':
                return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">Confirmada</Badge>;
            case 'completada':
                return <Badge className="bg-blue-600 hover:bg-blue-700 text-white">Completada</Badge>;
            case 'pendiente':
                return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">Pendiente</Badge>;
            case 'cancelada':
                return <Badge className="bg-red-600 hover:bg-red-700 text-white">Cancelada</Badge>;
            default:
                return <Badge variant="outline">{est}</Badge>;
        }
    };

    return (
        <>
            <Head title={`Dashboard Dueño - ${complejo?.nombre ?? 'Mi Complejo'}`} />

            <div className="flex-1 space-y-6 p-8 pt-6">
                {/* Encabezado */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Building2 className="h-8 w-8 text-primary" />
                            {complejo?.nombre ?? 'Panel del Complejo'}
                        </h2>
                        <p className="text-muted-foreground">
                            Resumen analítico y filtrado avanzado de estadísticas históricas de tu negocio.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            asChild={!rangoFechasInvalido}
                            disabled={rangoFechasInvalido}
                            className="border-emerald-600 text-emerald-500 hover:bg-emerald-400/10"
                        >
                            {rangoFechasInvalido ? (
                                <span className="flex items-center">
                                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                                    Exportar Excel
                                </span>
                            ) : (
                                <a href={`/reportes/duenio/excel?${buildQueryString()}`}>
                                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                                    Exportar Excel
                                </a>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            asChild={!rangoFechasInvalido}
                            disabled={rangoFechasInvalido}
                            className="border-rose-600 text-rose-500 hover:bg-rose-400/10"
                        >
                            {rangoFechasInvalido ? (
                                <span className="flex items-center">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Exportar PDF
                                </span>
                            ) : (
                                <a href={`/reportes/duenio/pdf?${buildQueryString()}`}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Exportar PDF
                                </a>
                            )}
                        </Button>
                        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Link href="/canchas/create">Nueva Cancha</Link>
                        </Button>
                    </div>
                </div>

                {/* Barra de Filtros Analíticos */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Filter className="h-4 w-4 text-indigo-400" />
                            Filtros de Estadísticas y Reportes
                        </CardTitle>
                        <CardDescription>
                            Si dejas las fechas vacías se muestran todos los registros históricos. Para un día puntual, selecciona la misma fecha en Inicio y Fin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Fecha Inicio</label>
                                <input
                                    type="date"
                                    value={formFilters.fecha_inicio}
                                    onChange={(e) => {
                                        const nuevaInicio = e.target.value;
                                        setFormFilters({ ...formFilters, fecha_inicio: nuevaInicio });
                                        if (nuevaInicio && formFilters.fecha_fin && formFilters.fecha_fin < nuevaInicio) {
                                            setDateError('La fecha fin no puede ser anterior a la fecha inicio.');
                                        } else {
                                            setDateError('');
                                        }
                                    }}
                                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Fecha Fin</label>
                                <input
                                    type="date"
                                    min={formFilters.fecha_inicio || undefined}
                                    value={formFilters.fecha_fin}
                                    onChange={(e) => {
                                        const nuevaFin = e.target.value;
                                        setFormFilters({ ...formFilters, fecha_fin: nuevaFin });
                                        if (formFilters.fecha_inicio && nuevaFin && nuevaFin < formFilters.fecha_inicio) {
                                            setDateError('La fecha fin no puede ser anterior a la fecha inicio.');
                                        } else {
                                            setDateError('');
                                        }
                                    }}
                                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Cancha</label>
                                <select
                                    value={formFilters.cancha_id}
                                    onChange={(e) => setFormFilters({ ...formFilters, cancha_id: e.target.value })}
                                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                >
                                    <option value="">Todas las canchas</option>
                                    {canchas.map((c) => (
                                        <option key={c.id} value={c.id}>{c.nombre} ({c.tamanio})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Horario</label>
                                <select
                                    value={formFilters.horario_inicio}
                                    onChange={(e) => setFormFilters({ ...formFilters, horario_inicio: e.target.value })}
                                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                >
                                    <option value="">Todos los horarios</option>
                                    {horariosDisponibles.map((h, i) => (
                                        <option key={i} value={h.start_time}>{h.start_time} - {h.end_time}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Estado / Reseña</label>
                                <div className="flex gap-1 mt-1">
                                    <select
                                        value={formFilters.estado}
                                        onChange={(e) => setFormFilters({ ...formFilters, estado: e.target.value })}
                                        className="w-1/2 rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                                    >
                                        <option value="">Estado (Todos)</option>
                                        <option value="confirmada">Confirmada</option>
                                        <option value="completada">Completada</option>
                                        <option value="pendiente">Pendiente</option>
                                        <option value="cancelada">Cancelada</option>
                                    </select>
                                    <select
                                        value={formFilters.tipo_resenia}
                                        onChange={(e) => setFormFilters({ ...formFilters, tipo_resenia: e.target.value })}
                                        className="w-1/2 rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                                    >
                                        <option value="">Reseñas (Todas)</option>
                                        <option value="positivas">Positivas (4-5 ★)</option>
                                        <option value="negativas">Negativas (1-3 ★)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="submit"
                                    disabled={rangoFechasInvalido}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    Filtrar
                                </Button>
                                <Button type="button" variant="ghost" size="icon" onClick={handleResetFilters} title="Mostrar todo (limpiar filtros)">
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </div>
                        </form>

                        {(dateError || rangoFechasInvalido) && (
                            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-xs flex items-center gap-2 border border-destructive/20">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span>{dateError || 'La fecha fin no puede ser anterior a la fecha inicio.'}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Tarjetas de Métricas */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Recaudación Período</CardTitle>
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${metrics.total_recaudado.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Confirmadas y completadas</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Canchas Activas</CardTitle>
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_canchas}</div>
                            <p className="text-xs text-muted-foreground">Habilitadas en complejo</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Reservas Filtradas</CardTitle>
                            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_reservas}</div>
                            <p className="text-xs text-muted-foreground">Turnos en el rango</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
                            <TrendingUp className="h-4 w-4 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.porcentaje_ocupacion}%</div>
                            <p className="text-xs text-muted-foreground">Capacidad utilizada</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Calificación Media</CardTitle>
                            <Star className="h-4 w-4 text-amber-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.promedio_resenia} / 5</div>
                            <p className="text-xs text-muted-foreground">Promedio de reseñas</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Sección de Gráficos */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Evolución de Ingresos</CardTitle>
                            <CardDescription>Monto recaudado histórico según precio congelado ($)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ingresosMensuales} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                        <XAxis dataKey="mes" stroke="#a1a1aa" fontSize={12} />
                                        <YAxis stroke="#a1a1aa" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                                            labelStyle={{ color: '#fafafa', fontWeight: 600 }}
                                        />
                                        <Bar dataKey="monto" fill="#10b981" radius={[4, 4, 0, 0]} name="Recaudación ($)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Estado de Reservas</CardTitle>
                            <CardDescription>
                                Verde: Confirmada | Azul: Completada | Amarillo: Pendiente | Rojo: Cancelada
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={distribucionEstados}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {distribucionEstados.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.fill ?? STATUS_COLOR_MAP[entry.name] ?? '#64748b'}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fafafa' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tablas de Reservas Filtradas y Reseñas */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Detalle de Reservas Filtradas</CardTitle>
                                <CardDescription>Mostrando hasta 15 resultados recientes del filtro</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/reservas" className="flex items-center gap-1">
                                    Ir a Reservas <ArrowUpRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Jugador</TableHead>
                                        <TableHead>Cancha / Hora</TableHead>
                                        <TableHead>Reseña</TableHead>
                                        <TableHead className="text-right">Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reservasFiltradas.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                                No hay reservas que coincidan con los filtros seleccionados.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        reservasFiltradas.map((reserva) => (
                                            <TableRow key={reserva.id}>
                                                <TableCell className="font-medium">{reserva.fecha}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {reserva.jugador?.name ?? reserva.nya_jugador ?? 'Sin asignar'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {reserva.jugador?.email ?? 'Presencial'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs font-semibold">{reserva.horario?.cancha?.nombre}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {reserva.horario ? `${reserva.horario.start_time} - ${reserva.horario.end_time}` : '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {reserva.resenia ? (
                                                        <Badge variant="outline" className="text-amber-400 border-amber-500/40">
                                                            {reserva.resenia.calificacion} ★
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {renderBadgeEstado(reserva.estado)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Reseñas de Jugadores</CardTitle>
                            <CardDescription>Feedback filtrado por calificación y fecha</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {reseniasFiltradas.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No se encontraron reseñas para los filtros actuales.
                                </p>
                            ) : (
                                reseniasFiltradas.map((res) => (
                                    <div key={res.id} className="rounded-lg border p-3 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold">
                                                {res.reserva?.jugador?.name ?? 'Jugador'} — {res.reserva?.horario?.cancha?.nombre}
                                            </span>
                                            <Badge className={res.calificacion >= 4 ? 'bg-emerald-600' : 'bg-red-600'}>
                                                {res.calificacion} / 5 ★
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {res.comentario || 'Sin comentario escrito.'}
                                        </p>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}