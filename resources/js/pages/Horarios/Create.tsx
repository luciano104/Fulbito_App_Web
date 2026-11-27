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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    Save,
    LoaderCircle,
    Clock
} from 'lucide-react';

interface Cancha {
    id: number;
    nombre: string;
    tamanio: string;
    tipo_piso: string;
    disponible?: boolean;
}

interface Props {
    canchas: Cancha[];
}

export default function Create({ canchas }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        start_time: "16:00",
        end_time: "17:00",
        cancha_id: canchas?.length === 1 ? String(canchas[0].id) : "",
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post("/horarios");
    };

    return (
        <>
            <Head title="Nuevo Horario Base" />

            <div className="flex-1 space-y-6 p-8 pt-6 max-w-3xl mx-auto">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Clock className="h-8 w-8 text-primary" />
                            Nuevo Horario Base
                        </h2>
                        <p className="text-muted-foreground">
                            Define una nueva franja horaria disponible para tus canchas.
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/horarios">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver a la grilla
                        </Link>
                    </Button>
                </div>

                <form onSubmit={submit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Datos de la Franja Horaria</CardTitle>
                            <CardDescription>
                                Selecciona la cancha de tu complejo y especifica la hora de inicio y fin.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="cancha_id">Cancha Asignada</Label>
                                <select
                                    id="cancha_id"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={data.cancha_id}
                                    onChange={(e) => setData("cancha_id", e.target.value)}
                                    autoFocus
                                >
                                    <option value="">Selecciona una cancha...</option>
                                    {(canchas || []).map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.nombre} — {c.tamanio} ({c.tipo_piso})
                                        </option>
                                    ))}
                                </select>
                                {errors.cancha_id && (
                                    <p className="text-sm font-medium text-destructive">{errors.cancha_id}</p>
                                )}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="start_time">Hora de Inicio</Label>
                                    <Input
                                        id="start_time"
                                        type="time"
                                        value={data.start_time}
                                        onChange={(e) => setData("start_time", e.target.value)}
                                    />
                                    {errors.start_time && (
                                        <p className="text-sm font-medium text-destructive">{errors.start_time}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="end_time">Hora de Fin</Label>
                                    <Input
                                        id="end_time"
                                        type="time"
                                        value={data.end_time}
                                        onChange={(e) => setData("end_time", e.target.value)}
                                    />
                                    {errors.end_time && (
                                        <p className="text-sm font-medium text-destructive">{errors.end_time}</p>
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
                                {processing ? "Guardando..." : "Guardar Horario"}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </>
    );
}