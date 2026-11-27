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
    Building2,
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

interface User {
    id: number;
    name: string;
}

interface Complejo {
    id: number;
    nombre: string;
    direccion: string;
    precio_base: number;
    tipo_piso: string;
    canchas_count?: number;
    admin?: User;
}

interface ComplejosPaginados {
    data: Complejo[];
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
    direccion: string;
    admin: string;
    orden: string;
    dir_orden: string;
    por_pagina: number;
}

interface Props {
    complejos: ComplejosPaginados;
    admins: User[];
    filtros: Filtros;
}

export default function Index({ complejos, admins, filtros }: Props) {
    const [nombre, setNombre] = useState(filtros.nombre ?? "");
    const [direccion, setDireccion] = useState(filtros.direccion ?? "");
    const [admin, setAdmin] = useState(filtros.admin ?? "");
    const [orden, setOrden] = useState(filtros.orden ?? "nombre");
    const [dirOrden, setDirOrden] = useState(filtros.dir_orden ?? "asc");
    const [porPagina, setPorPagina] = useState(filtros.por_pagina ?? 5);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [idSeleccionado, setIdSeleccionado] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const aplicarFiltros = (e: FormEvent) => {
        e.preventDefault();
        router.get("/complejos", {
            nombre,
            direccion,
            admin,
            orden,
            dir_orden: dirOrden,
            por_pagina: porPagina,
        }, { preserveState: true });
    };

    const limpiarFiltros = () => {
        setNombre("");
        setDireccion("");
        setAdmin("");
        setOrden("nombre");
        setDirOrden("asc");
        setPorPagina(5);
        router.get("/complejos");
    };

    const ordenarPor = (campo: string) => {
        const nuevaDir = orden === campo && dirOrden === "asc" ? "desc" : "asc";
        setOrden(campo);
        setDirOrden(nuevaDir);

        router.get("/complejos", {
            nombre,
            direccion,
            admin,
            orden: campo,
            dir_orden: nuevaDir,
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
        router.delete(`/complejos/${idSeleccionado}`, {
            onSuccess: () => {
                setIsModalOpen(false);
                setIdSeleccionado(null);
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    const RenderizarIconoOrden = ({ campo }: { campo: string }) => {
        if (orden !== campo) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
        return dirOrden === "asc"
            ? <ArrowUp className="ml-2 h-4 w-4 text-foreground" />
            : <ArrowDown className="ml-2 h-4 w-4 text-foreground" />;
    };

    return (
        <>
            <Head title="Complejos Deportivos" />

            <div className="flex-1 space-y-6 p-8 pt-6">
                {/* Encabezado */}
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Building2 className="h-8 w-8 text-primary" />
                            Complejos Deportivos
                        </h2>
                        <p className="text-muted-foreground">
                            Gestión global de complejos adheridos a la plataforma.
                        </p>
                    </div>
                    <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                        <Link href="/complejos/create">
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Complejo
                        </Link>
                    </Button>
                </div>

                <FlashMessage />

                {/* Barra de Filtros Separada */}
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={aplicarFiltros} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 items-end">
                            <div className="grid gap-2 lg:col-span-3">
                                <label className="text-sm font-medium leading-none">Nombre</label>
                                <Input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    placeholder="Ej: La Catedral..."
                                />
                            </div>

                            <div className="grid gap-2 lg:col-span-3">
                                <label className="text-sm font-medium leading-none">Dirección</label>
                                <Input
                                    type="text"
                                    value={direccion}
                                    onChange={(e) => setDireccion(e.target.value)}
                                    placeholder="Ej: Av. Belgrano..."
                                />
                            </div>

                            <div className="grid gap-2 lg:col-span-3">
                                <label className="text-sm font-medium leading-none">Dueño (Admin)</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={admin}
                                    onChange={(e) => setAdmin(e.target.value)}
                                >
                                    <option value="">Todos los dueños</option>
                                    {admins.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-2 lg:col-span-1">
                                <label className="text-sm font-medium leading-none">Filas</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={porPagina}
                                    onChange={(e) => setPorPagina(Number(e.target.value))}
                                >
                                    <option value="5">5</option>
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                </select>
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
                    <CardHeader>
                        <CardTitle>Listado de Complejos</CardTitle>
                        <CardDescription>
                            Mostrando de {complejos.from ?? 0} a {complejos.to ?? 0} de {complejos.total} complejos activos.
                        </CardDescription>
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
                                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => ordenarPor("direccion")}>
                                            <div className="flex items-center">
                                                Dirección <RenderizarIconoOrden campo="direccion" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => ordenarPor("precio_base")}>
                                            <div className="flex items-center">
                                                Precio Base <RenderizarIconoOrden campo="precio_base" />
                                            </div>
                                        </TableHead>
                                        <TableHead>Piso</TableHead>
                                        <TableHead>Dueño (Admin)</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {complejos.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                No se encontraron complejos registrados.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        complejos.data.map((complejo) => (
                                            <TableRow key={complejo.id}>
                                                <TableCell className="font-medium">{complejo.nombre}</TableCell>
                                                <TableCell>{complejo.direccion}</TableCell>
                                                <TableCell>${Number(complejo.precio_base).toLocaleString('es-AR')}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {complejo.tipo_piso}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{complejo.admin?.name ?? 'Sin Asignar'}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="ghost" size="icon" title="Ver detalle" asChild>
                                                            <Link href={`/complejos/${complejo.id}`}>
                                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                                            </Link>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" title="Editar" asChild>
                                                            <Link href={`/complejos/${complejo.id}/edit`}>
                                                                <Pencil className="h-4 w-4 text-muted-foreground" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Desactivar complejo"
                                                            onClick={() => handleEliminar(complejo.id)}
                                                            className="hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
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
                                Página {complejos.current_page} de {complejos.last_page}
                            </div>
                            <div className="space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!complejos.prev_page_url}
                                    onClick={() => complejos.prev_page_url && router.get(complejos.prev_page_url)}
                                >
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!complejos.next_page_url}
                                    onClick={() => complejos.next_page_url && router.get(complejos.next_page_url)}
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
                        <AlertDialogTitle>¿Desactivar complejo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            El complejo y sus canchas pasarán a estado inactivo y dejarán de aparecer para nuevas reservas.
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
                                "Sí, desactivar complejo"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}