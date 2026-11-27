import { Link, router, Head } from "@inertiajs/react";
import { useState, type FormEvent } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Plus,
    Search,
    RotateCcw,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Pencil,
    Trash2,
    Eye,
    Trophy,
    Loader2
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
    precio: number;
    disponible: boolean;
}

interface CanchasPaginadas {
    data: Cancha[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Filtros {
    nombre: string;
    tipo_piso: string;
    estado: string;
    precio_max: string;
    orden: string;
    direccion: string;
    por_pagina: number;
}

interface Props {
    canchas: CanchasPaginadas;
    filtros: Filtros;
}

export default function Index({ canchas, filtros }: Props) {
    const [nombre, setNombre] = useState(filtros.nombre ?? "");
    const [tipoPiso, setTipoPiso] = useState(filtros.tipo_piso ?? "");
    const [estado, setEstado] = useState(filtros.estado ?? "");
    const [precioMax, setPrecioMax] = useState(filtros.precio_max ?? "");
    const [orden, setOrden] = useState(filtros.orden ?? "nombre");
    const [direccion, setDireccion] = useState(filtros.direccion ?? "asc");
    const [porPagina, setPorPagina] = useState(filtros.por_pagina ?? 5);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [idSeleccionado, setIdSeleccionado] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { can, hasRole } = useAuth();
    const esEmpleado = hasRole('empleado');

    const aplicarFiltros = (e: FormEvent) => {
        e.preventDefault();
        router.get("/canchas", {
            nombre,
            tipo_piso: tipoPiso,
            estado,
            precio_max: precioMax,
            orden,
            direccion,
            por_pagina: porPagina,
        }, { preserveState: true });
    };

    const limpiarFiltros = () => {
        setNombre("");
        setTipoPiso("");
        setEstado("");
        setPrecioMax("");
        setOrden("nombre");
        setDireccion("asc");
        setPorPagina(5);
        router.get("/canchas");
    };

    const ordenarPor = (campo: string) => {
        const nuevaDir = orden === campo && direccion === "asc" ? "desc" : "asc";
        setOrden(campo);
        setDireccion(nuevaDir);

        router.get("/canchas", {
            nombre,
            tipo_piso: tipoPiso,
            estado,
            precio_max: precioMax,
            orden: campo,
            direccion: nuevaDir,
            por_pagina: porPagina,
        }, { preserveState: true });
    };

    const handleEliminar = (id: number) => {
        setIdSeleccionado(id);
        setIsModalOpen(true);
    };

    const ejecutarEliminacion = () => {
        if (!idSeleccionado) return;
        setIsDeleting(true);
        router.delete(`/canchas/${idSeleccionado}`, {
            onSuccess: () => {
                setIsModalOpen(false);
                setIdSeleccionado(null);
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    const RenderizarIconoOrden = ({ campo }: { campo: string }) => {
        if (orden !== campo) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
        return direccion === "asc"
            ? <ArrowUp className="ml-2 h-4 w-4 text-foreground" />
            : <ArrowDown className="ml-2 h-4 w-4 text-foreground" />;
    };

    return (
        <>
            <Head title="Canchas" />

            <div className="flex-1 space-y-6 p-8 pt-6">
                {/* Encabezado */}
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Trophy className="h-8 w-8 text-primary" />
                            Canchas del Complejo
                        </h2>
                        <p className="text-muted-foreground">
                            Consulta y administración de las canchas habilitadas en tu predio.
                        </p>
                    </div>
                    {!esEmpleado && can('crear canchas') && (
                        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                            <Link href="/canchas/create">
                                <Plus className="w-4 h-4 mr-2" />
                                Nueva Cancha
                            </Link>
                        </Button>
                    )}
                </div>

                <FlashMessage />

                {/* Barra de Filtros */}
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={aplicarFiltros} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 items-end">
                            <div className="grid gap-2 lg:col-span-3">
                                <label className="text-sm font-medium leading-none">Nombre</label>
                                <Input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    placeholder="Ej: Cancha 1..."
                                />
                            </div>

                            <div className="grid gap-2 lg:col-span-3">
                                <label className="text-sm font-medium leading-none">Tipo de Piso</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={tipoPiso}
                                    onChange={(e) => setTipoPiso(e.target.value)}
                                >
                                    <option value="">Todos los pisos</option>
                                    <option value="sintetico">Césped Sintético</option>
                                    <option value="natural">Césped Natural</option>
                                    <option value="parquet">Parquet / Tablado</option>
                                    <option value="cemento">Cemento</option>
                                    <option value="tierra">Tierra</option>
                                </select>
                            </div>

                            <div className="grid gap-2 lg:col-span-2">
                                <label className="text-sm font-medium leading-none">Estado</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={estado}
                                    onChange={(e) => setEstado(e.target.value)}
                                >
                                    <option value="">Todos</option>
                                    <option value="1">Disponible</option>
                                    <option value="0">No disponible</option>
                                </select>
                            </div>

                            <div className="grid gap-2 lg:col-span-2">
                                <label className="text-sm font-medium leading-none">Precio máx. ($)</label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={precioMax}
                                    onChange={(e) => setPrecioMax(e.target.value)}
                                    placeholder="Ej: 25000"
                                />
                            </div>

                            <div className="flex gap-2 lg:col-span-2">
                                <Button type="submit" variant="secondary" className="flex-1">
                                    <Search className="mr-2 h-4 w-4" />
                                    Filtrar
                                </Button>
                                <Button type="button" variant="ghost" size="icon" onClick={limpiarFiltros} title="Limpiar filtros">
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Tabla de Resultados */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Listado de Canchas</CardTitle>
                            <CardDescription>
                                Mostrando de {canchas.from ?? 0} a {canchas.to ?? 0} de {canchas.total} canchas.
                            </CardDescription>
                        </div>
                        <select
                            className="flex h-9 w-28 rounded-md border border-input bg-background px-2 text-sm"
                            value={porPagina}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setPorPagina(val);
                                router.get("/canchas", {
                                    nombre,
                                    tipo_piso: tipoPiso,
                                    estado,
                                    precio_max: precioMax,
                                    orden,
                                    direccion,
                                    por_pagina: val,
                                }, { preserveState: true });
                            }}
                        >
                            <option value="5">5 filas</option>
                            <option value="10">10 filas</option>
                            <option value="20">20 filas</option>
                        </select>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => ordenarPor("nombre")}>
                                            <div className="flex items-center">
                                                Nombre <RenderizarIconoOrden campo="nombre" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => ordenarPor("tamanio")}>
                                            <div className="flex items-center">
                                                Tamaño <RenderizarIconoOrden campo="tamanio" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => ordenarPor("tipo_piso")}>
                                            <div className="flex items-center">
                                                Tipo de Piso <RenderizarIconoOrden campo="tipo_piso" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => ordenarPor("precio")}>
                                            <div className="flex items-center">
                                                Precio / Hora <RenderizarIconoOrden campo="precio" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => ordenarPor("disponible")}>
                                            <div className="flex items-center">
                                                Estado <RenderizarIconoOrden campo="disponible" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(!canchas?.data || canchas.data.length === 0) ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                No se encontraron canchas con los filtros seleccionados.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        canchas.data.map((cancha) => (
                                            <TableRow key={cancha.id}>
                                                <TableCell className="font-semibold">{cancha.nombre}</TableCell>
                                                <TableCell>{cancha.tamanio}</TableCell>
                                                <TableCell className="capitalize">{cancha.tipo_piso}</TableCell>
                                                <TableCell>${Number(cancha.precio).toLocaleString('es-AR')}</TableCell>
                                                <TableCell>
                                                    <Badge variant={cancha.disponible ? "default" : "secondary"}>
                                                        {cancha.disponible ? "Disponible" : "No disponible"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="ghost" size="icon" title="Ver detalle" asChild>
                                                            <Link href={`/canchas/${cancha.id}`}>
                                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                                            </Link>
                                                        </Button>
                                                        {!esEmpleado && can('editar canchas') && (
                                                            <Button variant="ghost" size="icon" title="Editar" asChild>
                                                                <Link href={`/canchas/${cancha.id}/edit`}>
                                                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        {!esEmpleado && can('eliminar canchas') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                title="Desactivar cancha"
                                                                onClick={() => handleEliminar(cancha.id)}
                                                                className="hover:text-destructive hover:bg-destructive/10"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Paginación */}
                        <div className="flex items-center justify-between space-x-2 py-4">
                            <div className="text-sm text-muted-foreground">
                                Página {canchas.current_page} de {canchas.last_page}
                            </div>
                            <div className="space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!canchas.prev_page_url}
                                    onClick={() => canchas.prev_page_url && router.get(canchas.prev_page_url)}
                                >
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!canchas.next_page_url}
                                    onClick={() => canchas.next_page_url && router.get(canchas.next_page_url)}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Desactivar cancha?</AlertDialogTitle>
                        <AlertDialogDescription>
                            La cancha pasará a estado inactivo y no estará disponible para nuevas reservas.
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
                                    <Loader2 className="w-4 h-4 animate-spin" /> Desactivando...
                                </div>
                            ) : (
                                "Sí, desactivar cancha"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}