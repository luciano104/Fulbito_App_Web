import { Link, router, Head } from "@inertiajs/react";
import { useState, type FormEvent } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    RotateCcw,
    Trash2,
    Clock,
    Loader2,
    ChevronLeft,
    ChevronRight
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

interface Cancha {
    id: number;
    nombre: string;
    tamanio: string;
    tipo_piso: string;
    disponible: boolean;
}

type EstadoCelda =
    | 'libre'
    | 'reservado'
    | 'completado'
    | 'finalizado'
    | 'mantenimiento'
    | 'no_configurado';

interface Celda {
    horario_id: number | null;
    cancha_id: number;
    estado: EstadoCelda;
}

interface Fila {
    hora: string;
    rango: string;
    celdas: Celda[];
}

interface Filtros {
    fecha: string;
}

interface Props {
    canchasColumnas: Cancha[];
    filas: Fila[];
    totalHorarios: number;
    filtros: Filtros;
}

export default function Index({
    canchasColumnas,
    filas,
    totalHorarios,
    filtros
}: Props) {
    const [fecha, setFecha] = useState(filtros.fecha ?? new Date().toISOString().split('T')[0]);

    const [horarioSeleccionado, setHorarioSeleccionado] = useState<{
        id: number;
        rango: string;
        canchaNombre: string;
        estado: EstadoCelda;
    } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { can, hasRole } = useAuth();
    const esEmpleado = hasRole('empleado');
    const puedeCrear = !esEmpleado && can('crear horarios');
    const puedeEliminar = !esEmpleado && can('eliminar horarios');

    const consultarFecha = (nuevaFecha: string) => {
        if (!nuevaFecha) return;
        setFecha(nuevaFecha);
        router.get("/horarios", { fecha: nuevaFecha }, { preserveState: true });
    };

    const aplicarFiltros = (e: FormEvent) => {
        e.preventDefault();
        consultarFecha(fecha);
    };

    const volverAHoy = () => {
        const hoy = new Date().toISOString().split('T')[0];
        setFecha(hoy);
        router.get("/horarios");
    };

    const moverDia = (dias: number) => {
        const [y, m, d] = fecha.split('-').map(Number);
        const nueva = new Date(y, m - 1, d + dias).toISOString().split('T')[0];
        consultarFecha(nueva);
    };

    const ejecutarEliminacion = () => {
        if (!horarioSeleccionado) return;
        setIsDeleting(true);
        router.delete(`/horarios/${horarioSeleccionado.id}`, {
            onSuccess: () => {
                setHorarioSeleccionado(null);
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    const getEstilosCelda = (estado: EstadoCelda, interactiva: boolean) => {
        const cursor = interactiva ? "cursor-pointer" : "cursor-default";
        switch (estado) {
            case 'libre':
                return `bg-emerald-50 border-emerald-300 text-emerald-900 ${interactiva ? 'hover:bg-emerald-100' : ''} ${cursor}`;
            case 'reservado':
                return `bg-red-50 border-red-300 text-red-900 ${interactiva ? 'hover:bg-red-100' : ''} ${cursor}`;
            case 'completado':
                return `bg-indigo-50 border-indigo-300 text-indigo-900 ${interactiva ? 'hover:bg-indigo-100' : ''} ${cursor}`;
            case 'mantenimiento':
                return `bg-amber-50 border-amber-300 text-amber-900 ${interactiva ? 'hover:bg-amber-100' : ''} ${cursor}`;
            case 'finalizado':
                return `bg-muted/70 border-border text-muted-foreground ${interactiva ? 'hover:bg-muted' : ''} ${cursor}`;
            default:
                return "bg-muted/20 border-dashed border-border text-muted-foreground/40 cursor-default";
        }
    };

    const getLabelEstado = (estado: EstadoCelda) => {
        switch (estado) {
            case 'libre':
                return 'Libre';
            case 'reservado':
                return 'Reservado';
            case 'completado':
                return 'Completado';
            case 'mantenimiento':
                return 'Mantenim.';
            case 'finalizado':
                return 'Sin reserva';
            default:
                return '—';
        }
    };

    const handleClickCelda = (celda: Celda, rango: string, cancha: Cancha) => {
        if (!celda.horario_id || !puedeEliminar) return;

        setHorarioSeleccionado({
            id: celda.horario_id,
            rango,
            canchaNombre: `${cancha.nombre} (${cancha.tamanio} - ${cancha.tipo_piso})`,
            estado: celda.estado,
        });
    };

    return (
        <>
            <Head title="Horarios Base" />

            <div className="flex-1 space-y-6 p-8 pt-6">
                {/* Encabezado */}
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Clock className="h-8 w-8 text-primary" />
                            Horarios Base
                        </h2>
                        <p className="text-muted-foreground">
                            Grilla de franjas horarias configuradas por cancha y estado del día.
                        </p>
                    </div>
                    {puedeCrear && (
                        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                            <Link href="/horarios/create">
                                <Plus className="w-4 h-4 mr-2" />
                                Nuevo Horario
                            </Link>
                        </Button>
                    )}
                </div>

                <FlashMessage />

                {/* Filtro único por fecha */}
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={aplicarFiltros} className="flex flex-col gap-3 sm:flex-row sm:items-end justify-between">
                            <div className="grid gap-2 w-full sm:max-w-xs">
                                <label className="text-sm font-medium leading-none">Fecha de consulta</label>
                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => moverDia(-1)}
                                        title="Día anterior"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Input
                                        type="date"
                                        value={fecha}
                                        onChange={(e) => consultarFecha(e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => moverDia(1)}
                                        title="Día siguiente"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <Button type="button" variant="outline" onClick={volverAHoy}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Volver a hoy
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Grilla de Horarios */}
                <Card>
                    <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle>Grilla de Horarios Base ({totalHorarios} franjas)</CardTitle>
                            <CardDescription>
                                {puedeEliminar
                                    ? "Haz clic sobre un bloque configurado si deseas eliminarlo."
                                    : "Visualización de las franjas horarias habilitadas por cancha."}
                            </CardDescription>
                        </div>

                        {/* Leyenda de estados */}
                        <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                            <span className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-sm bg-emerald-200 border border-emerald-400" />
                                Libre
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-sm bg-red-200 border border-red-400" />
                                Reservado
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-sm bg-indigo-200 border border-indigo-400" />
                                Completado
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-sm bg-muted border border-border" />
                                Sin reserva
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-sm bg-amber-200 border border-amber-400" />
                                Mantenim.
                            </span>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {canchasColumnas.length === 0 || filas.length === 0 ? (
                            <div className="h-32 flex items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                                No se encontraron horarios base registrados.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <div className="min-w-[600px] space-y-2">
                                    {/* Cabecera con nombres de canchas */}
                                    <div
                                        className="grid gap-2 items-center"
                                        style={{
                                            gridTemplateColumns: `115px repeat(${canchasColumnas.length}, minmax(135px, 1fr))`,
                                        }}
                                    >
                                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                                            Franja
                                        </div>
                                        {canchasColumnas.map((cancha) => (
                                            <div
                                                key={cancha.id}
                                                className={`rounded-lg border p-2.5 text-center ${
                                                    cancha.disponible
                                                        ? "bg-primary/5 border-primary/20"
                                                        : "bg-amber-50 border-amber-300"
                                                }`}
                                            >
                                                <div className="font-bold text-sm">{cancha.nombre}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {cancha.tamanio} · {cancha.tipo_piso}
                                                </div>
                                                {!cancha.disponible && (
                                                    <Badge
                                                        variant="outline"
                                                        className="mt-1 text-[10px] border-amber-500 text-amber-800"
                                                    >
                                                        Mantenimiento
                                                    </Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Filas de franjas horarias */}
                                    {filas.map((fila) => (
                                        <div
                                            key={fila.hora}
                                            className="grid gap-2 items-stretch"
                                            style={{
                                                gridTemplateColumns: `115px repeat(${canchasColumnas.length}, minmax(135px, 1fr))`,
                                            }}
                                        >
                                            <div className="flex items-center justify-center rounded-md border bg-muted/40 px-2 text-xs font-semibold text-muted-foreground">
                                                {fila.rango} hs
                                            </div>

                                            {fila.celdas.map((celda, idx) => {
                                                const cancha = canchasColumnas[idx];
                                                const interactiva = Boolean(celda.horario_id && puedeEliminar);

                                                return (
                                                    <button
                                                        key={`${fila.hora}-${celda.cancha_id}`}
                                                        type="button"
                                                        disabled={!interactiva}
                                                        onClick={() => handleClickCelda(celda, fila.rango, cancha)}
                                                        className={`group relative flex items-center justify-center rounded-md border py-3 px-2 text-xs font-semibold transition-colors ${getEstilosCelda(
                                                            celda.estado,
                                                            interactiva
                                                        )}`}
                                                    >
                                                        <span>{getLabelEstado(celda.estado)}</span>
                                                        {interactiva && (
                                                            <Trash2 className="h-3.5 w-3.5 opacity-0 group-hover:opacity-70 transition-opacity ml-1.5" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal de confirmación para eliminar horario base */}
            <AlertDialog
                open={!!horarioSeleccionado}
                onOpenChange={(open) => !open && setHorarioSeleccionado(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            ¿Eliminar horario {horarioSeleccionado?.rango} hs?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Cancha: <strong>{horarioSeleccionado?.canchaNombre}</strong>.
                            <br />
                            Estado en la fecha seleccionada:{" "}
                            <strong className="uppercase">{horarioSeleccionado?.estado}</strong>.
                            <br />
                            <br />
                            Esta acción eliminará permanentemente la franja horaria de la cancha (solo permitido si no posee reservas activas a futuro).
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
                                "Sí, eliminar horario"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}