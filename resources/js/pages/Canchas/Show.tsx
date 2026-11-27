import { Link, Head } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Pencil,
    Trophy,
    DollarSign,
    Building2,
    Clock,
    Layers
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface Complejo {
    id: number;
    nombre: string;
}

interface Horario {
    id: number;
    start_time: string;
    end_time: string;
}

interface Cancha {
    id: number;
    nombre: string;
    tamanio: string;
    tipo_piso: string;
    precio: number;
    disponible: boolean;
    complejo?: Complejo;
    horarios?: Horario[];
}

interface Props {
    cancha: Cancha;
}

export default function Show({ cancha }: Props) {
    const { can, hasRole } = useAuth();
    const esEmpleado = hasRole('empleado');

    const formatHora = (hora: string) => hora?.slice(0, 5) ?? hora;

    return (
        <>
            <Head title={`Cancha: ${cancha.nombre}`} />

            <div className="flex-1 space-y-6 p-8 pt-6">
                {/* Encabezado */}
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Trophy className="h-8 w-8 text-primary" />
                            {cancha.nombre}
                            <Badge variant="outline" className="ml-2 text-sm">
                                {cancha.tamanio}
                            </Badge>
                        </h2>
                        <p className="text-muted-foreground flex items-center gap-1 mt-1">
                            <Building2 className="h-4 w-4" /> Complejo: {cancha.complejo?.nombre ?? 'Sin Asignar'}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" asChild>
                            <Link href="/canchas">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver
                            </Link>
                        </Button>
                        {!esEmpleado && can('editar canchas') && (
                            <Button asChild>
                                <Link href={`/canchas/${cancha.id}/edit`}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Tarjeta de Información General */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalles de la Cancha</CardTitle>
                            <CardDescription>Superficie, tarifa y disponibilidad actual</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-500">
                                        <Layers className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Superficie / Piso</p>
                                        <p className="text-lg font-semibold capitalize">{cancha.tipo_piso}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                                        <DollarSign className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Precio por Hora</p>
                                        <p className="text-lg font-semibold">${Number(cancha.precio).toLocaleString('es-AR')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Estado de Disponibilidad</p>
                                    <div className="mt-1">
                                        <Badge variant={cancha.disponible ? "default" : "secondary"} className="text-sm px-3 py-1">
                                            {cancha.disponible ? "Disponible" : "No disponible"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tarjeta de Horarios Base Asignados */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Horarios Base Configurados
                            </CardTitle>
                            <CardDescription>
                                Total: {cancha.horarios?.length ?? 0} turnos base
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {cancha.horarios && cancha.horarios.length > 0 ? (
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {cancha.horarios.map((horario) => (
                                        <li
                                            key={horario.id}
                                            className="flex items-center justify-between p-3 text-sm border rounded-md hover:bg-muted/50 transition-colors"
                                        >
                                            <span className="font-medium">
                                                {formatHora(horario.start_time)} - {formatHora(horario.end_time)}
                                            </span>
                                            <Badge variant="outline" className="shrink-0 bg-background">
                                                Turno
                                            </Badge>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center p-6 border border-dashed rounded-lg text-muted-foreground">
                                    No hay horarios base registrados para esta cancha.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}