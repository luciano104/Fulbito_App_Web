import { Link, Head } from "@inertiajs/react";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Pencil,
    Printer,
    Building2,
    MapPin,
    Star,
    Ticket
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface Jugador {
    id: number;
    name: string;
    email: string;
}

interface Complejo {
    id: number;
    nombre: string;
    direccion?: string;
    ciudad?: string;
}

interface Cancha {
    id: number;
    nombre: string;
    tamanio: string;
    tipo_piso: string;
    precio?: number;
    complejo?: Complejo;
}

interface Horario {
    id: number;
    start_time: string;
    end_time: string;
    cancha?: Cancha;
}

interface Resena {
    id: number;
    calificacion: number;
    comentario: string;
}

interface Reserva {
    id: number;
    fecha: string;
    estado: string;
    nya_jugador?: string | null;
    jugador?: Jugador | null;
    horario?: Horario;
    resenia?: Resena | null;
}

interface Props {
    reserva: Reserva;
}

export default function Show({ reserva }: Props) {
    const { can } = useAuth();

    const formatHora = (hora?: string) => hora?.slice(0, 5) ?? '';
    const codigoTicket = `RES-${String(reserva.id).padStart(6, '0')}`;
    const cancha = reserva.horario?.cancha;
    const complejo = cancha?.complejo;
    const precio = cancha?.precio ? Number(cancha.precio) : null;
    const puedeEditar = can('editar reservas') &&
        reserva.estado !== 'completada' &&
        reserva.estado !== 'cancelada';

    const renderBadgeEstado = (est: string) => {
        switch (est) {
            case 'confirmada':
                return <Badge className="bg-emerald-600 text-white uppercase tracking-wider">Confirmada</Badge>;
            case 'pendiente':
                return <Badge variant="outline" className="text-amber-600 border-amber-600 uppercase tracking-wider">Pendiente</Badge>;
            case 'cancelada':
                return <Badge variant="destructive" className="uppercase tracking-wider">Cancelada</Badge>;
            case 'completada':
                return <Badge className="bg-indigo-600 text-white uppercase tracking-wider">Completada</Badge>;
            default:
                return <Badge variant="outline" className="uppercase tracking-wider">{est}</Badge>;
        }
    };

    return (
        <>
            <Head title={`Comprobante ${codigoTicket}`} />

            {/* Estilos exclusivos para impresión: oculta sidebar/header y expande el ticket */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #ticket-imprimible,
                    #ticket-imprimible * {
                        visibility: visible;
                    }
                    #ticket-imprimible {
                        position: fixed;
                        left: 50%;
                        top: 24px;
                        transform: translateX(-50%);
                        width: 90%;
                        max-width: 540px;
                        box-shadow: none !important;
                        border: 1px solid #cbd5e1 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>

            <div className="flex-1 space-y-6 p-8 pt-6 max-w-xl mx-auto">
                {/* Barra superior de acciones (se oculta al imprimir) */}
                <div className="flex items-center justify-between print:hidden">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/reservas">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir Ticket
                        </Button>
                        {puedeEditar && (
                            <Button size="sm" asChild>
                                <Link href={`/reservas/${reserva.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Cambiar Estado
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Cuerpo del Ticket / Recibo */}
                <div
                    id="ticket-imprimible"
                    className="rounded-xl border bg-card text-card-foreground shadow-md overflow-hidden"
                >
                    {/* Cabecera del Complejo */}
                    <div className="bg-slate-900 text-white px-6 py-5 text-center space-y-1">
                        <div className="inline-flex items-center justify-center gap-1.5 text-xs uppercase tracking-widest text-slate-300">
                            <Ticket className="h-3.5 w-3.5" />
                            Comprobante de Reserva
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {complejo?.nombre ?? 'Complejo Deportivo'}
                        </h1>
                        {(complejo?.direccion || complejo?.ciudad) && (
                            <p className="text-xs text-slate-300 flex items-center justify-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {[complejo.direccion, complejo.ciudad].filter(Boolean).join(', ')}
                            </p>
                        )}
                    </div>

                    {/* Número de Ticket y Estado */}
                    <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-b">
                        <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">N° Comprobante</p>
                            <p className="font-mono text-base font-bold">{codigoTicket}</p>
                        </div>
                        <div>{renderBadgeEstado(reserva.estado)}</div>
                    </div>

                    {/* Detalle principal */}
                    <div className="px-6 py-5 space-y-4 text-sm">
                        <div className="flex justify-between items-baseline">
                            <span className="text-muted-foreground">Titular</span>
                            <div className="text-right">
                                <p className="font-semibold">
                                    {reserva.jugador?.name ?? reserva.nya_jugador ?? 'Sin asignar'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {reserva.jugador?.email ?? 'Reserva presencial / mostrador'}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Fecha del Turno</span>
                            <span className="font-semibold">{reserva.fecha}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Franja Horaria</span>
                            <span className="font-semibold">
                                {reserva.horario
                                    ? `${formatHora(reserva.horario.start_time)} - ${formatHora(reserva.horario.end_time)} hs`
                                    : 'N/A'}
                            </span>
                        </div>

                        <div className="flex justify-between items-baseline">
                            <span className="text-muted-foreground">Cancha Asignada</span>
                            <div className="text-right">
                                <p className="font-semibold">{cancha?.nombre ?? 'Sin asignar'}</p>
                                {cancha && (
                                    <p className="text-xs text-muted-foreground">
                                        {cancha.tamanio} · {cancha.tipo_piso}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Línea de corte tipo ticket */}
                    <div className="relative flex items-center justify-between px-6">
                        <div className="h-5 w-5 -ml-8 rounded-full border bg-background" />
                        <div className="w-full border-t-2 border-dashed border-border" />
                        <div className="h-5 w-5 -mr-8 rounded-full border bg-background" />
                    </div>

                    {/* Total / Importe */}
                    <div className="px-6 py-5 bg-muted/10 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Valor del Turno</span>
                            <span className="text-2xl font-bold tracking-tight">
                                {precio !== null ? `$${precio.toLocaleString()}` : 'A confirmar'}
                            </span>
                        </div>

                        {/* Reseña si existe */}
                        {reserva.resenia && (
                            <div className="mt-3 rounded-lg border bg-amber-500/5 p-3 text-xs space-y-1">
                                <div className="flex items-center justify-between font-semibold text-amber-600">
                                    <span className="flex items-center gap-1">
                                        <Star className="h-3.5 w-3.5 fill-amber-500" />
                                        Reseña del Jugador
                                    </span>
                                    <span>{reserva.resenia.calificacion} / 5</span>
                                </div>
                                {reserva.resenia.comentario && (
                                    <p className="text-muted-foreground italic">
                                        "{reserva.resenia.comentario}"
                                    </p>
                                )}
                            </div>
                        )}

                        <p className="pt-2 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                            <Building2 className="h-3 w-3" />
                            Presentar este comprobante en recepción antes del inicio del turno.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}