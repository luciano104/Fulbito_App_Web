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
    Building2,
    UserPlus,
    Mail
} from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Props {
    admins: User[];
}

export default function Create({ admins }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        nombre: "",
        direccion: "",
        latitud: "",
        longitud: "",
        precio_base: "",
        tipo_piso: "sintetico",
        admin_id: "",
        admin_email: "",
        activo: true,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post("/complejos");
    };

    return (
        <>
            <Head title="Nuevo Complejo" />

            <div className="flex-1 space-y-6 p-8 pt-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Building2 className="h-8 w-8 text-primary" />
                            Nuevo Complejo
                        </h2>
                        <p className="text-muted-foreground">
                            Completa los datos para dar de alta un nuevo complejo en el sistema.
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
                            <CardTitle>Información General</CardTitle>
                            <CardDescription>
                                Ingresa la ubicación y características principales del predio.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="nombre">Nombre del Complejo</Label>
                                    <Input
                                        id="nombre"
                                        type="text"
                                        value={data.nombre}
                                        onChange={(e) => setData("nombre", e.target.value)}
                                        placeholder="Ej: Complejo San Martín"
                                        autoFocus
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
                                        placeholder="Ej: Av. Belgrano 1234"
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
                                        onChange={(e) => setData("latitud", e.target.value)}
                                        placeholder="Ej: -24.7879"
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
                                        onChange={(e) => setData("longitud", e.target.value)}
                                        placeholder="Ej: -65.4070"
                                    />
                                    {errors.longitud && (
                                        <p className="text-sm font-medium text-destructive">{errors.longitud}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="precio_base">Precio Base ($)</Label>
                                    <Input
                                        id="precio_base"
                                        type="number"
                                        step="0.01"
                                        value={data.precio_base}
                                        onChange={(e) => setData("precio_base", e.target.value)}
                                        placeholder="Ej: 25000"
                                    />
                                    {errors.precio_base && (
                                        <p className="text-sm font-medium text-destructive">{errors.precio_base}</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="tipo_piso">Tipo de piso por defecto</Label>
                                    <select
                                        id="tipo_piso"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        value={data.tipo_piso}
                                        onChange={(e) => setData("tipo_piso", e.target.value)}
                                    >
                                        <option value="sintetico">Césped Sintético</option>
                                        <option value="pasto">Césped Natural</option>
                                        <option value="cemento">Cemento</option>
                                        <option value="tierra">Tierra</option>
                                    </select>
                                    {errors.tipo_piso && (
                                        <p className="text-sm font-medium text-destructive">{errors.tipo_piso}</p>
                                    )}
                                </div>
                            </div>

                            {/* Bloque de Dueño / Administrador */}
                            <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
                                <div className="flex items-start gap-3">
                                    <UserPlus className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
                                    <div className="space-y-1">
                                        <Label className="text-base font-semibold">
                                            Dueño del Complejo (Administrador)
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Ingresa el correo electrónico del dueño para crear su cuenta con contraseña temporal (<code>dueno123</code>) y enviarle automáticamente por email los datos del complejo y sus credenciales.
                                        </p>
                                    </div>
                                </div>

                                {admins.length > 0 && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="admin_id">Vincular Dueño Existente (Opcional)</Label>
                                        <select
                                            id="admin_id"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={data.admin_id}
                                            onChange={(e) => {
                                                setData("admin_id", e.target.value);
                                                if (e.target.value !== "") {
                                                    setData("admin_email", "");
                                                }
                                            }}
                                        >
                                            <option value="">✨ Crear cuenta nueva para el dueño con el email de abajo</option>
                                            {admins.map((a) => (
                                                <option key={a.id} value={a.id}>
                                                    Vincular existente: {a.name} ({a.email})
                                                </option>
                                            ))}
                                        </select>
                                        {errors.admin_id && (
                                            <p className="text-sm font-medium text-destructive">{errors.admin_id}</p>
                                        )}
                                    </div>
                                )}

                                {data.admin_id === "" && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="admin_email" className="flex items-center gap-1.5">
                                            <Mail className="h-4 w-4 text-indigo-600" />
                                            Correo Electrónico del Dueño (Obligatorio) *
                                        </Label>
                                        <Input
                                            id="admin_email"
                                            type="email"
                                            value={data.admin_email}
                                            onChange={(e) => setData("admin_email", e.target.value)}
                                            placeholder="Ej: propietario@gmail.com"
                                            required
                                        />
                                        {errors.admin_email && (
                                            <p className="text-sm font-medium text-destructive">{errors.admin_email}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>

                        <CardFooter className="bg-muted/10 border-t px-6 py-4 flex justify-end">
                            <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                                {processing ? (
                                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                {processing ? "Guardando y enviando mail..." : "Guardar Complejo"}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </>
    );
}