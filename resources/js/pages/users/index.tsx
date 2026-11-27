import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertTriangle, Building2, Eye, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import FlashMessage from '@/components/flash-message';

interface Role {
    id: number;
    name: string;
}

interface ComplejoRef {
    id: number;
    nombre: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    complejo_id?: number | null;
    complejo?: ComplejoRef | null;
    complejo_administrado?: ComplejoRef | null;
    roles: Role[];
    tiene_datos_defecto?: boolean;
    campos_defecto?: string[];
}

interface IndexProps {
    users: User[];
}

export default function Index({ users }: IndexProps) {
    const { props } = usePage<any>();
    const authRoles: string[] = props.auth?.user?.roles?.map((r: any) => r.name ?? r) ?? [];
    const esAdmin = authRoles.includes('admin') && !authRoles.includes('super-admin');

    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [idSeleccionado, setIdSeleccionado] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const usuariosConDatosDefecto = users.filter((u) => u.tiene_datos_defecto);

    const handleDelete = (id: number) => {
        setIdSeleccionado(id);
        setIsModalOpen(true);
    };

    const ejecutarEliminacion = () => {
        if (!idSeleccionado) return;
        setIsDeleting(true);
        router.delete(`/users/${idSeleccionado}`, {
            onSuccess: () => {
                setIsModalOpen(false);
                setIdSeleccionado(null);
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    const filteredUsers = users.filter((user) => {
        const matchesName = user.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesEmail = user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = user.roles.some(role =>
            role.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return matchesName || matchesEmail || matchesRole;
    });

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {esAdmin ? 'Empleados del Complejo' : 'Usuarios y Roles'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {esAdmin
                            ? 'Administra las cuentas de los empleados vinculados a tu complejo.'
                            : 'Administra las cuentas de usuario, complejos asignados y sus niveles de acceso.'}
                    </p>
                </div>
                <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                    <Link href={'/users/create'}>
                        <Plus className="w-4 h-4 mr-2" />
                        {esAdmin ? 'Agregar Empleado' : 'Registrar Usuario'}
                    </Link>
                </Button>
            </div>

            {/* Aviso global si existen cuentas con datos por defecto */}
            {usuariosConDatosDefecto.length > 0 && (
                <div className="p-4 rounded-lg border border-amber-300 bg-amber-50/90 text-amber-950 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm space-y-1">
                        <p className="font-semibold">
                            Hay {usuariosConDatosDefecto.length} cuenta(s) que todavía conservan datos por defecto:
                        </p>
                        <ul className="list-disc list-inside text-xs space-y-0.5 text-amber-900">
                            {usuariosConDatosDefecto.map((u) => (
                                <li key={u.id}>
                                    <strong>{u.name}</strong> ({u.email}): {u.campos_defecto?.join(' · ')}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Herramientas de búsqueda */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-1 items-center space-x-2 max-w-md">
                    <Input
                        placeholder="Buscar por nombre, email o rol..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-10"
                    />
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            onClick={() => setSearchQuery('')}
                            className="h-10 px-3"
                        >
                            Limpiar
                        </Button>
                    )}
                </div>
                <div className="text-sm text-muted-foreground">
                    Mostrando <strong>{filteredUsers.length}</strong> de {users.length} {esAdmin ? 'empleados' : 'usuarios'}
                </div>
            </div>

            {/* Tabla de Usuarios */}
            <div className="border rounded-md bg-white shadow-sm">
                <FlashMessage />
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[70px]">ID</TableHead>
                            <TableHead>Nombre / Email</TableHead>
                            <TableHead>Roles Asignados</TableHead>
                            {!esAdmin && <TableHead>Complejo</TableHead>}
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={esAdmin ? 4 : 5} className="h-24 text-center text-muted-foreground">
                                    No se encontraron usuarios que coincidan con los criterios.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => {
                                const esEmpleado = user.roles.some(r => r.name === 'empleado');
                                const esRolAdmin = user.roles.some(r => r.name === 'admin');
                                const nombreComplejo = esRolAdmin
                                    ? user.complejo_administrado?.nombre
                                    : user.complejo?.nombre;

                                return (
                                    <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium text-muted-foreground">#{user.id}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-foreground">{user.name}</span>
                                                    {user.tiene_datos_defecto && (
                                                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[11px]">
                                                            ⚠️ Datos por defecto
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                                {user.tiene_datos_defecto && user.campos_defecto && (
                                                    <span className="text-[11px] text-amber-700">
                                                        Pendiente: {user.campos_defecto.join(' | ')}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1.5">
                                                {user.roles.length === 0 ? (
                                                    <span className="text-xs italic text-muted-foreground">Sin roles asignados</span>
                                                ) : (
                                                    user.roles.map(role => (
                                                        <Badge key={role.id} variant="outline" className="bg-primary/5 text-primary border-primary/20 capitalize">
                                                            💼 {role.name}
                                                        </Badge>
                                                    ))
                                                )}
                                            </div>
                                        </TableCell>
                                        {!esAdmin && (
                                            <TableCell>
                                                {nombreComplejo ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                                                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                                                        {nombreComplejo}
                                                    </span>
                                                ) : esEmpleado ? (
                                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                                                        Sin complejo asignado
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                        )}
                                        <TableCell className="text-right space-x-2 whitespace-nowrap">
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-slate-600 hover:text-slate-900"
                                                title="Ver detalles"
                                            >
                                                <Link href={`/users/${user.id}`}>
                                                    <Eye className="w-4 h-4 mr-1.5" />
                                                    Ver
                                                </Link>
                                            </Button>
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                                                title="Editar usuario"
                                            >
                                                <Link href={`/users/${user.id}/edit`}>
                                                    <Pencil className="w-4 h-4 mr-1.5" />
                                                    Editar
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(user.id)}
                                                className="h-8 text-red-600 hover:text-red-900 hover:bg-red-50"
                                                title="Eliminar usuario"
                                            >
                                                <Trash2 className="w-4 h-4 mr-1.5" />
                                                Eliminar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Modal de Confirmación */}
            <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <AlertDialogContent className="sm:max-w-[425px]">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-red-50 text-red-600 rounded-full">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <AlertDialogTitle className="text-xl">¿Eliminar usuario?</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
                            Estás a punto de borrar este usuario permanentemente. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
                        <AlertDialogCancel
                            disabled={isDeleting}
                            onClick={() => setIsModalOpen(false)}
                        >
                            Volver
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isDeleting}
                            onClick={(e) => {
                                e.preventDefault();
                                ejecutarEliminacion();
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white font-medium shadow-xs transition-colors duration-200"
                        >
                            {isDeleting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Eliminando...</span>
                                </div>
                            ) : (
                                "Sí, eliminar usuario"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}