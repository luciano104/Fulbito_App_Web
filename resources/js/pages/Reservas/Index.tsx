import { Link, router, Head } from "@inertiajs/react";
import { useState, type FormEvent } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Plus,
    Search,
    RotateCcw,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Pencil,
    Trash2,
    Eye,
    CalendarCheck,
    Loader2
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import FlashMessage from "@/components/flash-message";
import { useAuth } from '@/hooks/use-auth';

interface Jugador {
    id: number;
    name: string;
    email: string;
}

interface Cancha {
    id: number;
    nombre: string;
    tamanio: string;
    tipo_piso: string;
    precio?: number;
}

interface Horario {
    id: number;
    start_time: string;
    end_time: string;
    cancha?: Cancha;
}

interface Reserva {
    id: number;
    fecha: string;
    estado: string;
    nya_jugador?: string | null;
    cliente_nombre?: string;
    jugador?: Jugador | null;
    horario?: Horario;
}

interface ReservasPaginadas {
    data: Reserva[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Filtros {
    buscar: string;
    estado: string;
    fecha: string;
    orden: string;
    direccion: string;
    por_pagina: number;
}

interface Props {
    reservas: ReservasPaginadas;
    estados?: string[];
    filtros: Filtros;
}

export default function Index({ reservas, estados = ['pendiente', 'confirmada', 'completada', 'cancelada'], filtros }: Props) {
    const [buscar, setBuscar] = useState(filtros.buscar ?? "");
    const [estado, setEstado] = useState(filtros.estado ?? "");
    const [fecha, setFecha] = useState(filtros.fecha ?? "");
    const [orden, setOrden] = useState(filtros.orden ?? "fecha");
    const [direccion, setDireccion] = useState(filtros.direccion ?? "desc");
    const [porPagina, setPorPagina] = useState(filtros.por_pagina ?? 10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [idSeleccionado, setIdSeleccionado] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { can } = useAuth();

    const formatHora = (hora?: string) => hora?.slice(0, 5) ?? '';

    const aplicarFiltros = (e: FormEvent) => {
        e.preventDefault();
        router.get("/reservas", {
            buscar,
            estado,
            fecha,
            orden,
            direccion,
            por_pagina: porPagina,
        }, { preserveState: true });
    };

    const limpiarFiltros = () => {
        setBuscar("");
        setEstado("");
        setFecha("");
        setOrden("fecha");
        setDireccion("desc");
        setPorPagina(10);
        // Enviamos fecha vacía explícitamente para ver todas las reservas (sin el filtro de hoy por defecto)
        router.get("/reservas", { fecha: "" });
    };

    const ordenarPor = (campo: string) => {
        const nuevaDir = orden === campo && direccion === "asc" ? "desc" : "asc";
        setOrden(campo);
        setDireccion(nuevaDir);

        router.get("/reservas", {
            buscar,
            estado,
            fecha,
            orden: campo,
            direccion: nuevaDir,
            por_pagina: porPagina,
        }, { preserveState: true });
    };

    const handleEliminar = (id: number) => {
        setIdSeleccionado(id);
        setIsModalOpen(true);
    };

    const ejecutarEliminacion = () => {
        if (!idSeleccionado) return;
        setIsDeleting(true);
        router.delete(`/reservas/${idSeleccionado}`, {
            onSuccess: () => {
                setIsModalOpen(false);
                setIdSeleccionado(null);
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    const renderBadgeEstado = (est: string) => {
        switch (est) {
            case 'confirmada':
                return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">Confirmada</Badge>;
            case 'pendiente':
                return <Badge variant="outline" className="text-amber-600 border-amber-600">Pendiente</Badge>;
            case 'cancelada':
                return <Badge variant="destructive">Cancelada</Badge>;
            case 'completada':
                return <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">Completada</Badge>;
            default:
                return <Badge variant="outline">{est}</Badge>;
        }
    };

    const RenderizarIconoOrden = ({ campo }: { campo: string }) => {
        if (orden !== campo) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
        return direccion === "asc"
            ? <ArrowUp className="ml-2 h-4 w-4 text-foreground" />
            : <ArrowDown className="ml-2 h-4 w-4 text-foreground" />;
    };

    return (
        <>
            <Head title="Reservas" />

            <div className="flex-1 space-y-6 p-8 pt-6">
                {/* Encabezado */}
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <CalendarCheck className="h-8 w-8 text-primary" />
                            Gestión de Reservas
                        </h2>
                        <p className="text-muted-foreground">
                            Planilla de turnos y control de reservas del complejo.
                        </p>
                    </div>
                    {can('crear reservas') && (
                        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                            <Link href="/reservas/create">
                                <Plus className="w-4 h-4 mr-2" />
                                Nueva Reserva
                            </Link>
                        </Button>
                    )}
                </div>

                <FlashMessage />

                {/* Filtros */}
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={aplicarFiltros} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 items-end">
                            <div className="grid gap-2 lg:col-span-4">
                                <label className="text-sm font-medium leading-none">Buscar Cliente o Cancha</label>
                                <Input
                                    type="text"
                                    value={buscar}
                                    onChange={(e) => setBuscar(e.target.value)}
                                    placeholder="Nombre, email o cancha..."
                                />
                            </div>

                            <div className="grid gap-2 lg:col-span-3">
                                <label className="text-sm font-medium leading-none">Estado</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={estado}
                                    onChange={(e) => setEstado(e.target.value)}
                                >
                                    <option value="">Todos los Estados</option>
                                    {estados.map((est) => (
                                        <option key={est} value={est}>
                                            {est.charAt(0).toUpperCase() + est.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-2 lg:col-span-2">
                                <label className="text-sm font-medium leading-none">Fecha</label>
                                <Input
                                    type="date"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-2 lg:col-span-1">
                                <label className="text-sm font-medium leading-none">Filas</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={porPagina}
                                    onChange={(e) => setPorPagina(Number(e.target.value))}
                                >
                                    <option value="5">5</option>
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                </select>
                            </div>

                            <div className="flex gap-2 lg:col-span-2">
                                <Button type="submit" variant="secondary" className="flex-1">
                                    <Search className="mr-2 h-4 w-4" />
                                    Buscar
                                </Button>
                                <Button type="button" variant="ghost" size="icon" onClick={limpiarFiltros} title="Ver todas / Limpiar filtros">
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Tabla de Resultados */}
                <Card>
                    <CardHeader>
                        <CardTitle>Listado de Reservas</CardTitle>
                        <CardDescription>
                            Mostrando de {reservas.from ?? 0} a {reservas.to ?? 0} de {reservas.total} reservas encontradas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => ordenarPor("fecha")}
                                        >
                                            <div className="flex items-center">
                                                Fecha <RenderizarIconoOrden campo="fecha" />
                                            </div>
                                        </TableHead>
                                        <TableHead>Cancha / Horario</TableHead>
                                        <TableHead>Jugador / Cliente</TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => ordenarPor("estado")}
                                        >
                                            <div className="flex items-center">
                                                Estado <RenderizarIconoOrden campo="estado" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(!reservas?.data || reservas.data.length === 0) ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                No se encontraron reservas cargadas.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        reservas.data.map((reserva) => {
                                            const puedeEditar = can('editar reservas') &&
                                                reserva.estado !== 'completada' &&
                                                reserva.estado !== 'cancelada';

                                            return (
                                                <TableRow key={reserva.id}>
                                                    <TableCell className="font-semibold">{reserva.fecha}</TableCell>
                                                    <TableCell>
                                                        <div className="font-semibold">
                                                            {reserva.horario?.cancha
                                                                ? `${reserva.horario.cancha.nombre} (${reserva.horario.cancha.tamanio})`
                                                                : 'Cancha sin asignar'}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {reserva.horario
                                                                ? `${formatHora(reserva.horario.start_time)} - ${formatHora(reserva.horario.end_time)} hs`
                                                                : 'N/A'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">
                                                            {reserva.jugador?.name ?? reserva.nya_jugador ?? 'Sin asignar'}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {reserva.jugador?.email ?? (reserva.nya_jugador ? 'Reserva presencial' : '')}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {renderBadgeEstado(reserva.estado)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button variant="ghost" size="icon" title="Ver comprobante" asChild>
                                                                <Link href={`/reservas/${reserva.id}`}>
                                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                                </Link>
                                                            </Button>
                                                            {puedeEditar && (
                                                                <Button variant="ghost" size="icon" title="Cambiar estado" asChild>
                                                                    <Link href={`/reservas/${reserva.id}/edit`}>
                                                                        <Pencil className="h-4 w-4 text-muted-foreground" />
                                                                    </Link>
                                                                </Button>
                                                            )}
                                                            {can('eliminar reservas') && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    title="Eliminar"
                                                                    onClick={() => handleEliminar(reserva.id)}
                                                                    className="hover:text-destructive hover:bg-destructive/10"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Paginación */}
                        <div className="flex items-center justify-between space-x-2 py-4">
                            <div className="text-sm text-muted-foreground">
                                Página {reservas.current_page} de {reservas.last_page}
                            </div>
                            <div className="space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!reservas.prev_page_url}
                                    onClick={() => reservas.prev_page_url && router.get(reservas.prev_page_url)}
                                >
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!reservas.next_page_url}
                                    onClick={() => reservas.next_page_url && router.get(reservas.next_page_url)}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Modal de confirmación de eliminación */}
            <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar reserva?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción desocupará la franja horaria y eliminará permanentemente el turno.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Volver</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isDeleting}
                            onClick={(e) => {
                                e.preventDefault();
                                ejecutarEliminacion();
                            }}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Eliminando...
                                </div>
                            ) : (
                                "Sí, eliminar reserva"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}