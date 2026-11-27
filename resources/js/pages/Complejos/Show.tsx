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
    Building2,
    MapPin,
    Star,
    DollarSign,
    UserCheck,
    Dumbbell,
    Layers,
    Compass
} from 'lucide-react';

interface User {
    id: number;
    name: string;
    email?: string;
}

interface Cancha {
    id: number;
    nombre: string;
    tamanio: string;
    tipo_piso: string;
    precio: number;
    disponible: boolean;
}

interface Complejo {
    id: number;
    nombre: string;
    direccion: string;
    latitud: number;
    longitud: number;
    precio_base: number;
    tipo_piso: string;
    avg_rating: number;
    total_reviews: number;
    admin?: User;
    canchas?: Cancha[];
}

interface Props {
    complejo: Complejo;
}

export default function Show({ complejo }: Props) {
    return (
        <>
            <Head title={`Complejo: ${complejo.nombre}`} />

            <div className="flex-1 space-y-6 p-8 pt-6">
                {/* Encabezado */}
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Building2 className="h-8 w-8 text-primary" />
                            {complejo.nombre}
                        </h2>
                        <p className="text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-4 w-4" /> {complejo.direccion}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" asChild>
                            <Link href="/complejos">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={`/complejos/${complejo.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Tarjeta de Información General */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalles del Complejo</CardTitle>
                            <CardDescription>Métricas e información general</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                                        <DollarSign className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Precio Base</p>
                                        <p className="text-lg font-semibold">${Number(complejo.precio_base).toLocaleString('es-AR')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-500">
                                        <Layers className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Tipo de Piso Principal</p>
                                        <p className="text-lg font-semibold capitalize">{complejo.tipo_piso}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/10 rounded-full text-amber-500">
                                        <Star className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Calificación Promedio</p>
                                        <p className="text-lg font-semibold flex items-center gap-2">
                                            {complejo.avg_rating ?? 0} ⭐
                                            <span className="text-xs text-muted-foreground">({complejo.total_reviews ?? 0} opiniones)</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/10 rounded-full text-indigo-500">
                                        <UserCheck className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Dueño Asignado</p>
                                        <p className="text-lg font-semibold">{complejo.admin?.name ?? 'Sin Asignar'}</p>
                                        {complejo.admin?.email && (
                                            <p className="text-xs text-muted-foreground">{complejo.admin.email}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-sky-500/10 rounded-full text-sky-500">
                                        <Compass className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Coordenadas GPS</p>
                                        <p className="text-sm font-mono">{complejo.latitud}, {complejo.longitud}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tarjeta de Canchas del Complejo */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Dumbbell className="h-5 w-5 text-primary" />
                                Canchas Activas
                            </CardTitle>
                            <CardDescription>
                                Total: {complejo.canchas?.length ?? 0} canchas registradas
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {complejo.canchas && complejo.canchas.length > 0 ? (
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {complejo.canchas.map((cancha) => (
                                        <li
                                            key={cancha.id}
                                            className="flex flex-col justify-between p-3 text-sm border rounded-md hover:bg-muted/50 transition-colors gap-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold">{cancha.nombre}</span>
                                                <Badge variant="outline" className="shrink-0 bg-background">
                                                    {cancha.tamanio}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span className="capitalize">{cancha.tipo_piso}</span>
                                                <span className="font-medium text-foreground">
                                                    ${Number(cancha.precio).toLocaleString('es-AR')}
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center p-6 border border-dashed rounded-lg text-muted-foreground">
                                    No hay canchas activas en este complejo.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}