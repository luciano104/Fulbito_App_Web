import { Link, useForm, Head } from "@inertiajs/react";
import type { FormEvent } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Save,
    LoaderCircle,
    Calendar,
    Clock,
    Trophy,
    User
} from 'lucide-react';

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
    jugador?: Jugador | null;
    horario?: Horario;
}

interface Props {
    reserva: Reserva;
    estados: string[];
}

const TRANSICIONES_POR_ESTADO: Record<string, string[]> = {
    pendiente: ['confirmada', 'cancelada'],
    confirmada: ['cancelada', 'completada'],
    cancelada: [],
    completada: [],
};

export default function Edit({ reserva, estados }: Props) {
    const opcionesEstado = estados?.length
        ? estados
        : (TRANSICIONES_POR_ESTADO[reserva.estado] ?? []);

    const { data, setData, put, processing, errors } = useForm({
        estado: opcionesEstado[0] ?? reserva.estado,
    });

    const formatHora = (hora?: string) => hora?.slice(0, 5) ?? '';

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(`/reservas/${reserva.id}`);
    };

    const esEstadoFinal = reserva.estado === 'completada' || reserva.estado === 'cancelada';

    return (
        <>
            <Head title={`Actualizar Estado - Reserva #${reserva.id}`} />

            <div className="flex-1 space-y-6 p-8 pt-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Reserva #{reserva.id}</h2>
                        <p className="text-muted-foreground">
                            Actualiza únicamente el estado del turno seleccionado.
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/reservas">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver al listado
                        </Link>
                    </Button>
                </div>

                <form onSubmit={submit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Estado de la Reserva</CardTitle>
                            <CardDescription>
                                Estado actual: <strong className="uppercase">{reserva.estado}</strong>. Los demás datos son fijos.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {/* Resumen fijo de la reserva */}
                            <div className="grid gap-3 sm:grid-cols-2 rounded-lg border bg-muted/20 p-4 text-sm">
                                <div className="flex items-start gap-2.5">
                                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Jugador / Cliente</p>
                                        <p className="font-semibold">
                                            {reserva.jugador?.name ?? reserva.nya_jugador ?? 'Sin asignar'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {reserva.jugador?.email ?? 'Reserva presencial'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Fecha del Turno</p>
                                        <p className="font-semibold">{reserva.fecha}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <Trophy className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Cancha</p>
                                        <p className="font-semibold">
                                            {reserva.horario?.cancha
                                                ? `${reserva.horario.cancha.nombre} (${reserva.horario.cancha.tamanio} - ${reserva.horario.cancha.tipo_piso})`
                                                : 'Sin asignar'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2.5">
                                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Franja Horaria</p>
                                        <p className="font-semibold">
                                            {reserva.horario
                                                ? `${formatHora(reserva.horario.start_time)} - ${formatHora(reserva.horario.end_time)} hs`
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Único campo editable */}
                            <div className="grid gap-2">
                                <Label htmlFor="estado">Nuevo Estado</Label>
                                <select
                                    id="estado"
                                    disabled={esEstadoFinal}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                                    value={data.estado}
                                    onChange={(e) => setData("estado", e.target.value)}
                                >
                                    {opcionesEstado.map((e) => (
                                        <option key={e} value={e}>
                                            {e.charAt(0).toUpperCase() + e.slice(1)}
                                        </option>
                                    ))}
                                </select>
                                {errors.estado && (
                                    <p className="text-sm font-medium text-destructive">{errors.estado}</p>
                                )}
                            </div>
                        </CardContent>

                        <CardFooter className="bg-muted/10 border-t px-6 py-4 flex justify-between items-center">
                            {esEstadoFinal ? (
                                <p className="text-sm font-medium text-muted-foreground">
                                    Esta reserva ya figura como {reserva.estado} y su estado es definitivo.
                                </p>
                            ) : (
                                <div />
                            )}
                            <Button type="submit" disabled={processing || esEstadoFinal} className="w-full sm:w-auto">
                                {processing ? (
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                {processing ? "Actualizando..." : "Actualizar Estado"}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </>
    );
}