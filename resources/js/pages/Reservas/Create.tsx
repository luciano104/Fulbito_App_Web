import { Link, useForm, Head } from "@inertiajs/react";
import { useState, type FormEvent } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Save,
    LoaderCircle,
    CalendarCheck,
    UserPlus,
    UserCheck
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

interface ReservaOcupada {
    fecha: string;
    horario_id: number;
}

interface Props {
    jugadores: Jugador[];
    horarios: Horario[];
    reservasOcupadas?: ReservaOcupada[];
    estados: string[];
}

export default function Create({ jugadores, horarios, reservasOcupadas = [], estados }: Props) {
    const [canchaId, setCanchaId] = useState<string>("");
    const [tipoCliente, setTipoCliente] = useState<"presencial" | "registrado">("presencial");

    const today = new Date().toISOString().split('T')[0];

    // 1. useForm debe ir ANTES de usar data.fecha
    const { data, setData, post, processing, errors } = useForm({
        fecha: today,
        estado: "confirmada",
        jugador_id: "",
        nya_jugador: "",
        horario_id: "",
    });

    const canchasUnicas = Array.from(
        new Map(
            (horarios || [])
                .filter((h) => h.cancha)
                .map((h) => [h.cancha!.id, h.cancha!])
        ).values()
    );

    // 2. IDs de horarios ocupados en la fecha seleccionada
    const horariosOcupadosEnFecha = new Set(
        (reservasOcupadas || [])
            .filter((r) => r.fecha.slice(0, 10) === data.fecha)
            .map((r) => String(r.horario_id))
    );

    // 3. Filtrar horarios por cancha Y excluir los ya ocupados en esa fecha
    const horariosDisponibles = (horarios || []).filter(
        (h) =>
            canchaId &&
            String(h.cancha?.id) === String(canchaId) &&
            !horariosOcupadosEnFecha.has(String(h.id))
    );

    const formatHora = (hora: string) => hora?.slice(0, 5) ?? hora;

    const cambiarTipoCliente = (tipo: "presencial" | "registrado") => {
        setTipoCliente(tipo);
        if (tipo === "presencial") {
            setData("jugador_id", "");
        } else {
            setData("nya_jugador", "");
        }
    };

    const handleFechaChange = (nuevaFecha: string) => {
        const sigueDisponible = !(reservasOcupadas || []).some(
            (r) =>
                r.fecha.slice(0, 10) === nuevaFecha &&
                String(r.horario_id) === String(data.horario_id)
        );

        setData((prev) => ({
            ...prev,
            fecha: nuevaFecha,
            horario_id: sigueDisponible ? prev.horario_id : "",
        }));
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post("/reservas");
    };

    return (
        <>
            <Head title="Nueva Reserva" />

            <div className="flex-1 space-y-6 p-8 pt-6 max-w-3xl mx-auto">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <CalendarCheck className="h-8 w-8 text-primary" />
                            Nueva Reserva
                        </h2>
                        <p className="text-muted-foreground">
                            Registra un turno presencial, telefónico o para un jugador de la plataforma.
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
                            <CardTitle>Datos de la Reserva</CardTitle>
                            <CardDescription>
                                Completa la fecha, los datos del cliente y el turno disponible.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {/* Fecha y Estado */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="fecha">Fecha del Turno</Label>
                                    <Input
                                        id="fecha"
                                        type="date"
                                        min={today}
                                        value={data.fecha}
                                        onChange={(e) => handleFechaChange(e.target.value)}
                                    />
                                    {errors.fecha && (
                                        <p className="text-sm font-medium text-destructive">{errors.fecha}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="estado">Estado Inicial</Label>
                                    <select
                                        id="estado"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        value={data.estado}
                                        onChange={(e) => setData("estado", e.target.value)}
                                    >
                                        {(estados || ['pendiente', 'confirmada'])
                                            .filter((e) => e === 'pendiente' || e === 'confirmada')
                                            .map((e) => (
                                                <option key={e} value={e}>
                                                    {e.charAt(0).toUpperCase() + e.slice(1)}
                                                </option>
                                            ))}
                                    </select>
                                    {errors.estado && (
                                        <p className="text-sm font-medium text-destructive">{errors.estado}</p>
                                    )}
                                </div>
                            </div>

                            {/* Selector de Tipo de Cliente */}
                            <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
                                <Label>Cliente que reserva</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        type="button"
                                        variant={tipoCliente === "presencial" ? "default" : "outline"}
                                        className="justify-start"
                                        onClick={() => cambiarTipoCliente("presencial")}
                                    >
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Cliente sin cuenta (Mostrador)
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={tipoCliente === "registrado" ? "default" : "outline"}
                                        className="justify-start"
                                        onClick={() => cambiarTipoCliente("registrado")}
                                    >
                                        <UserCheck className="mr-2 h-4 w-4" />
                                        Jugador registrado
                                    </Button>
                                </div>

                                {tipoCliente === "presencial" ? (
                                    <div className="grid gap-2 pt-2">
                                        <Label htmlFor="nya_jugador">Nombre y Apellido del Jugador</Label>
                                        <Input
                                            id="nya_jugador"
                                            type="text"
                                            placeholder="Ej. Juan Pérez"
                                            value={data.nya_jugador}
                                            onChange={(e) => setData("nya_jugador", e.target.value)}
                                            autoFocus
                                        />
                                        {errors.nya_jugador && (
                                            <p className="text-sm font-medium text-destructive">{errors.nya_jugador}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid gap-2 pt-2">
                                        <Label htmlFor="jugador_id">Seleccionar Jugador</Label>
                                        <select
                                            id="jugador_id"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={data.jugador_id}
                                            onChange={(e) => setData("jugador_id", e.target.value)}
                                        >
                                            <option value="">Selecciona un jugador...</option>
                                            {(jugadores || []).map((j) => (
                                                <option key={j.id} value={j.id}>
                                                    {j.name} ({j.email})
                                                </option>
                                            ))}
                                        </select>
                                        {errors.jugador_id && (
                                            <p className="text-sm font-medium text-destructive">{errors.jugador_id}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Cancha y Franja Horaria */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="cancha_id">Cancha</Label>
                                    <select
                                        id="cancha_id"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        value={canchaId}
                                        onChange={(e) => {
                                            setCanchaId(e.target.value);
                                            setData("horario_id", "");
                                        }}
                                    >
                                        <option value="">Selecciona una cancha...</option>
                                        {canchasUnicas.map((cancha) => (
                                            <option key={cancha.id} value={cancha.id}>
                                                {cancha.nombre} — {cancha.tamanio} ({cancha.tipo_piso})
                                                {cancha.precio ? ` · $${Number(cancha.precio).toLocaleString()}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="horario_id">Franja Horaria</Label>
                                    <select
                                        id="horario_id"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                                        value={data.horario_id}
                                        onChange={(e) => setData("horario_id", e.target.value)}
                                        disabled={!canchaId || horariosDisponibles.length === 0}
                                    >
                                        <option value="">
                                            {!canchaId
                                                ? "Primero elige una cancha..."
                                                : horariosDisponibles.length === 0
                                                    ? "No hay horarios disponibles para esta fecha"
                                                    : "Selecciona un horario disponible..."}
                                        </option>
                                        {horariosDisponibles.map((h) => (
                                            <option key={h.id} value={h.id}>
                                                {formatHora(h.start_time)} - {formatHora(h.end_time)} hs
                                            </option>
                                        ))}
                                    </select>
                                    {errors.horario_id && (
                                        <p className="text-sm font-medium text-destructive">{errors.horario_id}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="bg-muted/10 border-t px-6 py-4 flex justify-end">
                            <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                                {processing ? (
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                {processing ? "Guardando..." : "Registrar Reserva"}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </>
    );
}