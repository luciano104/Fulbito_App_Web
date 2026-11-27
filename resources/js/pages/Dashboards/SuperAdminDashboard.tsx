import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Building2,
    ShieldCheck,
    Users,
    CreditCard,
    Ban,
    CheckCircle,
    FileSpreadsheet,
    FileText,
    Filter,
    RotateCcw
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

interface ComplejoCliente {
    id: number;
    nombre: string;
    direccion: string;
    activo: boolean;
    created_at: string;
    admin?: { name: string; email: string };
}

interface PagoSuscripcion {
    id: number;
    complejo_id: number;
    complejo: string;
    plan: string;
    monto: number;
    fecha_pago: string;
    estado_pago: 'pagado' | 'pendiente' | 'vencido';
    metodo: string;
}

interface UsuarioStaff {
    id: number;
    name: string;
    email: string;
    rol: string;
    complejo: string;
}

interface SuperAdminDashboardProps {
    metrics?: {
        total_complejos: number;
        complejos_activos: number;
        complejos_inactivos: number;
        ingresos_saas_mes: number;
    };
    complejos?: ComplejoCliente[];
    todosLosComplejos?: { id: number; nombre: string }[];
    usuariosStaff?: UsuarioStaff[];
    pagosSuscripcion?: PagoSuscripcion[];
    filters?: {
        complejo_id?: string;
        estado?: string;
        fecha_inicio?: string;
        fecha_fin?: string;
    };
}

export default function SuperAdminDashboard({
    metrics = { total_complejos: 0, complejos_activos: 0, complejos_inactivos: 0, ingresos_saas_mes: 0 },
    complejos = [],
    todosLosComplejos = [],
    usuariosStaff = [],
    pagosSuscripcion = [],
    filters = {}
}: SuperAdminDashboardProps) {
    const [formFilters, setFormFilters] = useState({
        complejo_id: filters.complejo_id ?? '',
        estado: filters.estado ?? '',
        fecha_inicio: filters.fecha_inicio ?? '',
        fecha_fin: filters.fecha_fin ?? '',
    });

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/dashboard', formFilters, { preserveState: true, preserveScroll: true });
    };

    const handleReset = () => {
        const empty = { complejo_id: '', estado: '', fecha_inicio: '', fecha_fin: '' };
        setFormFilters(empty);
        router.get('/dashboard', {}, { preserveState: true });
    };

    const handleToggleActivo = (complejo: ComplejoCliente) => {
        router.patch(`/superadmin/complejos/${complejo.id}/toggle-activo`, {}, {
            preserveScroll: true,
        });
    };

    const buildQueryString = () => {
        const params = new URLSearchParams();
        Object.entries(formFilters).forEach(([k, v]) => {
            if (v) params.append(k, String(v));
        });
        return params.toString();
    };

    return (
        <>
            <Head title="Panel Superadmin - Gestión Comercial SaaS" />

            <div className="flex-1 space-y-6 p-8 pt-6">
                {/* Encabezado */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <ShieldCheck className="h-8 w-8 text-indigo-500" />
                            Administración Comercial (Superadmin)
                        </h2>
                        <p className="text-muted-foreground">
                            Control de complejos clientes, estado de licencias, suscripciones y personal administrativo.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild className="border-emerald-600 text-emerald-500 hover:bg-emerald-400">
                            <a href={`/reportes/superadmin/excel?${buildQueryString()}`}>
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                Exportar Excel
                            </a>
                        </Button>
                        <Button variant="outline" asChild className="border-rose-600 text-rose-500 hover:bg-rose-400">
                            <a href={`/reportes/superadmin/pdf?${buildQueryString()}`}>
                                <FileText className="h-4 w-4 mr-2" />
                                Exportar PDF
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Filtros */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Filter className="h-4 w-4 text-indigo-400" />
                            Filtros de Clientes y Facturación
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Complejo Cliente</label>
                                <select
                                    value={formFilters.complejo_id}
                                    onChange={(e) => setFormFilters({ ...formFilters, complejo_id: e.target.value })}
                                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                >
                                    <option value="">Todos los complejos</option>
                                    {todosLosComplejos.map((c) => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Estado del Servicio</label>
                                <select
                                    value={formFilters.estado}
                                    onChange={(e) => setFormFilters({ ...formFilters, estado: e.target.value })}
                                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                >
                                    <option value="">Todos (Activos e Inactivos)</option>
                                    <option value="activos">Solo Activos</option>
                                    <option value="inactivos">Solo Suspendidos / Inactivos</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Fecha Inicio</label>
                                <input
                                    type="date"
                                    value={formFilters.fecha_inicio}
                                    onChange={(e) => setFormFilters({ ...formFilters, fecha_inicio: e.target.value })}
                                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Fecha Fin</label>
                                <input
                                    type="date"
                                    value={formFilters.fecha_fin}
                                    onChange={(e) => setFormFilters({ ...formFilters, fecha_fin: e.target.value })}
                                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                                    Aplicar
                                </Button>
                                <Button type="button" variant="ghost" size="icon" onClick={handleReset} title="Restablecer">
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* KPIs SaaS */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Complejos Vendidos</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.total_complejos}</div>
                            <p className="text-xs text-muted-foreground">Total histórico registrado</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Complejos Activos</CardTitle>
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-400">{metrics.complejos_activos}</div>
                            <p className="text-xs text-muted-foreground">Con servicio habilitado</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Suspendidos / Inactivos</CardTitle>
                            <Ban className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-400">{metrics.complejos_inactivos}</div>
                            <p className="text-xs text-muted-foreground">Baja lógica aplicada</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ingresos Suscripciones</CardTitle>
                            <CreditCard className="h-4 w-4 text-indigo-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${metrics.ingresos_saas_mes.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Pagos cobrados (Mock MVP)</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabla de Complejos Clientes (Solo lectura + Suspender/Reactivar) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Complejos Registrados (Control de Acceso)</CardTitle>
                        <CardDescription>
                            Puedes suspender o dar de alta nuevamente un complejo. Los datos operativos propios del complejo son de solo lectura.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Complejo</TableHead>
                                    <TableHead>Dirección</TableHead>
                                    <TableHead>Dueño Titular</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acción de Licencia</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {complejos.map((comp) => (
                                    <TableRow key={comp.id}>
                                        <TableCell className="font-semibold">{comp.nombre}</TableCell>
                                        <TableCell className="text-muted-foreground">{comp.direccion}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{comp.admin?.name ?? 'Sin dueño'}</div>
                                            <div className="text-xs text-muted-foreground">{comp.admin?.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            {comp.activo ? (
                                                <Badge className="bg-emerald-600 text-white">Activo</Badge>
                                            ) : (
                                                <Badge className="bg-red-600 text-white">Suspendido</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant={comp.activo ? 'destructive' : 'default'}
                                                className={!comp.activo ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                                                onClick={() => handleToggleActivo(comp)}
                                            >
                                                {comp.activo ? 'Suspender Servicio' : 'Dar de Alta'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Tablas Inferiores: Reportes de Pago (Hardcodeados) + Usuarios Staff */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {/* Reportes de Pago de Suscripciones (Hardcoded) */}
                    <Card className="col-span-4">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Reportes de Pago de Licencias</CardTitle>
                                <Badge variant="outline" className="text-amber-400 border-amber-500/40">
                                    Datos Simulados (MVP)
                                </Badge>
                            </div>
                            <CardDescription>
                                Historial de cobros de suscripción a complejos (módulo de pasarela pendiente para etapa final).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Complejo</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Monto</TableHead>
                                        <TableHead className="text-right">Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pagosSuscripcion.map((pago) => (
                                        <TableRow key={pago.id}>
                                            <TableCell>{pago.fecha_pago}</TableCell>
                                            <TableCell className="font-medium">{pago.complejo}</TableCell>
                                            <TableCell className="text-xs">{pago.plan} ({pago.metodo})</TableCell>
                                            <TableCell className="font-semibold">${pago.monto.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">
                                                {pago.estado_pago === 'pagado' && <Badge className="bg-emerald-600">Pagado</Badge>}
                                                {pago.estado_pago === 'pendiente' && <Badge className="bg-yellow-500 text-black">Pendiente</Badge>}
                                                {pago.estado_pago === 'vencido' && <Badge className="bg-red-600">Vencido</Badge>}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Usuarios Dueños y Empleados */}
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Dueños y Empleados
                            </CardTitle>
                            <CardDescription>
                                Cuentas comerciales vinculadas a complejos (excluye jugadores).
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Usuario</TableHead>
                                        <TableHead>Rol</TableHead>
                                        <TableHead>Complejo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {usuariosStaff.map((u) => (
                                        <TableRow key={u.id}>
                                            <TableCell>
                                                <div className="font-medium text-sm">{u.name}</div>
                                                <div className="text-xs text-muted-foreground">{u.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="capitalize">
                                                    {u.rol}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs">{u.complejo}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}