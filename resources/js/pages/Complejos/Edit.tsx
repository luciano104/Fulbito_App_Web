import { Link, useForm, Head } from "@inertiajs/react";
import type { FormEvent } from "react";
import {
    Card,
    CardContent,
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
    Lock
} from 'lucide-react';

interface User {
    id: number;
    name: string;
    email?: string;
}

interface Complejo {
    id: number;
    nombre: string;
    direccion: string;
    latitud: number;
    longitud: number;
    precio_base: number;
    tipo_piso: string;
    admin?: User;
}

interface Props {
    complejo: Complejo;
}

export default function Edit({ complejo }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        nombre: complejo.nombre,
        direccion: complejo.direccion,
        latitud: complejo.latitud,
        longitud: complejo.longitud,
        precio_base: complejo.precio_base,
        tipo_piso: complejo.tipo_piso,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(`/complejos/${complejo.id}`);
    };

    return (
        <>
            <Head title={`Editar Complejo: ${complejo.nombre}`} />

            <div className="flex-1 space-y-6 p-8 pt-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Editar Complejo</h2>
                        <p className="text-muted-foreground">
                            Modifica los datos del complejo deportivo.
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/complejos">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver al listado
                        </Link>
                    </Button>
                </div>

                <form onSubmit={submit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Datos Principales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="nombre">Nombre</Label>
                                    <Input
                                        id="nombre"
                                        type="text"
                                        value={data.nombre}
                                        onChange={(e) => setData("nombre", e.target.value)}
                                    />
                                    {errors.nombre && (
                                        <p className="text-sm font-medium text-destructive">{errors.nombre}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="direccion">Dirección</Label>
                                    <Input
                                        id="direccion"
                                        type="text"
                                        value={data.direccion}
                                        onChange={(e) => setData("direccion", e.target.value)}
                                    />
                                    {errors.direccion && (
                                        <p className="text-sm font-medium text-destructive">{errors.direccion}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="latitud">Latitud</Label>
                                    <Input
                                        id="latitud"
                                        type="number"
                                        step="any"
                                        value={data.latitud}
                                        onChange={(e) => setData("latitud", Number(e.target.value))}
                                    />
                                    {errors.latitud && (
                                        <p className="text-sm font-medium text-destructive">{errors.latitud}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="longitud">Longitud</Label>
                                    <Input
                                        id="longitud"
                                        type="number"
                                        step="any"
                                        value={data.longitud}
                                        onChange={(e) => setData("longitud", Number(e.target.value))}
                                    />
                                    {errors.longitud && (
                                        <p className="text-sm font-medium text-destructive">{errors.longitud}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="precio_base">Precio Base ($)</Label>
                                    <Input
                                        id="precio_base"
                                        type="number"
                                        step="0.01"
                                        value={data.precio_base}
                                        onChange={(e) => setData("precio_base", Number(e.target.value))}
                                    />
                                    {errors.precio_base && (
                                        <p className="text-sm font-medium text-destructive">{errors.precio_base}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="tipo_piso">Tipo de piso</Label>
                                    <select
                                        id="tipo_piso"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        value={data.tipo_piso}
                                        onChange={(e) => setData("tipo_piso", e.target.value)}
                                    >
                                        <option value="sintetico">Césped Sintético</option>
                                        <option value="natural">Césped Natural</option>
                                        <option value="parquet">Parquet / Tablado</option>
                                        <option value="cemento">Cemento</option>
                                        <option value="tierra">Tierra</option>
                                    </select>
                                    {errors.tipo_piso && (
                                        <p className="text-sm font-medium text-destructive">{errors.tipo_piso}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label className="flex items-center gap-1.5 text-muted-foreground">
                                        <Lock className="h-3.5 w-3.5" />
                                        Dueño Asignado (No editable)
                                    </Label>
                                    <Input
                                        type="text"
                                        readOnly
                                        disabled
                                        value={
                                            complejo.admin
                                                ? `${complejo.admin.name}${complejo.admin.email ? ` (${complejo.admin.email})` : ''}`
                                                : 'Sin Asignar'
                                        }
                                        className="bg-muted/50 cursor-not-allowed"
                                    />
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
                                {processing ? "Actualizando..." : "Guardar Cambios"}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </>
    );
}