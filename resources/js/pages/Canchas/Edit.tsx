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

interface Complejo {
    id: number;
    nombre: string;
}

interface Cancha {
    id: number;
    nombre: string;
    tamanio: string;
    tipo_piso: string;
    precio: number;
    disponible: boolean;
    complejo?: Complejo;
}

interface Props {
    cancha: Cancha;
}

export default function Edit({ cancha }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        nombre: cancha.nombre,
        tamanio: cancha.tamanio,
        tipo_piso: cancha.tipo_piso,
        precio: cancha.precio,
        disponible: cancha.disponible,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(`/canchas/${cancha.id}`);
    };

    return (
        <>
            <Head title={`Editar Cancha: ${cancha.nombre}`} />

            <div className="flex-1 space-y-6 p-8 pt-6 max-w-3xl mx-auto">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Editar Cancha</h2>
                        <p className="text-muted-foreground">
                            Modifica la información, tarifa y disponibilidad de {cancha.nombre}.
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/canchas">
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
                                    <Label htmlFor="nombre">Nombre de la Cancha</Label>
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
                                    <Label className="flex items-center gap-1.5 text-muted-foreground">
                                        <Lock className="h-3.5 w-3.5" />
                                        Complejo (No editable)
                                    </Label>
                                    <Input
                                        type="text"
                                        readOnly
                                        disabled
                                        value={cancha.complejo?.nombre ?? "Mi Complejo"}
                                        className="bg-muted/50 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label htmlFor="tamanio">Tamaño</Label>
                                    <select
                                        id="tamanio"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        value={data.tamanio}
                                        onChange={(e) => setData("tamanio", e.target.value)}
                                    >
                                        <option value="F5">Fútbol 5 (F5)</option>
                                        <option value="F7">Fútbol 7 (F7)</option>
                                        <option value="F11">Fútbol 11 (F11)</option>
                                    </select>
                                    {errors.tamanio && (
                                        <p className="text-sm font-medium text-destructive">{errors.tamanio}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="tipo_piso">Tipo de Piso</Label>
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
                                    <Label htmlFor="precio">Precio por Hora ($)</Label>
                                    <Input
                                        id="precio"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.precio}
                                        onChange={(e) => setData("precio", Number(e.target.value))}
                                    />
                                    {errors.precio && (
                                        <p className="text-sm font-medium text-destructive">{errors.precio}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 p-4 border rounded-lg bg-muted/20">
                                <input
                                    type="checkbox"
                                    id="disponible"
                                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                                    checked={data.disponible}
                                    onChange={(e) => setData("disponible", e.target.checked)}
                                />
                                <div className="space-y-1 leading-none">
                                    <Label htmlFor="disponible" className="text-base cursor-pointer">
                                        Cancha Disponible
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Indica si la cancha está habilitada para recibir reservas.
                                    </p>
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