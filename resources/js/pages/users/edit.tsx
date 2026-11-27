import { useForm, Link, usePage } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Building2 } from 'lucide-react';

interface Role {
    id: number;
    name: string;
}

interface Complejo {
    id: number;
    nombre: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    complejo_id?: number | null;
}

interface EditProps {
    user: User;
    roles: Role[];
    complejos?: Complejo[];
    userRoles: string[];
    camposPorDefecto?: string[];
}

export default function Edit({ user, roles, complejos = [], userRoles, camposPorDefecto = [] }: EditProps) {
    const { props } = usePage<any>();
    const authRoles: string[] = props.auth?.user?.roles?.map((r: any) => r.name ?? r) ?? [];
    const esSuperAdmin = authRoles.includes('super-admin');

    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        roles: userRoles,
        complejo_id: user.complejo_id ? String(user.complejo_id) : '',
    });

    const handleCheckboxChange = (roleName: string, checked: boolean) => {
        if (checked) {
            setData('roles', [...data.roles, roleName]);
        } else {
            const nuevosRoles = data.roles.filter(r => r !== roleName);
            setData('roles', nuevosRoles);
            if (!nuevosRoles.includes('empleado')) {
                setData('complejo_id', '');
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/users/${user.id}`);
    };

    const esEmpleadoSeleccionado = data.roles.includes('empleado');

    return (
        <div className="p-8 max-w-3xl mx-auto space-y-6">
            {/* Cartel de aviso si conserva datos por defecto */}
            {camposPorDefecto.length > 0 && (
                <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-950 flex items-start gap-3 shadow-xs">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-sm">
                        <p className="font-semibold">
                            Este usuario todavía conserva datos por defecto generados automáticamente:
                        </p>
                        <ul className="list-disc list-inside text-xs space-y-0.5 text-amber-900">
                            {camposPorDefecto.map((item, idx) => (
                                <li key={idx}>{item}</li>
                            ))}
                        </ul>
                        <p className="text-xs text-amber-800 pt-1">
                            Actualiza los campos correspondientes abajo y guarda los cambios para personalizar la cuenta.
                        </p>
                    </div>
                </div>
            )}

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>
                        {esSuperAdmin ? `Editar Perfil y Roles: ${user.name}` : `Editar Empleado: ${user.name}`}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Datos de perfil */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre Completo</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                />
                                {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                />
                                {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                            </div>
                        </div>

                        {/* Modificar Contraseña (Opcional) */}
                        <div className="space-y-2 p-4 border rounded-md bg-amber-50/20 border-amber-200/40">
                            <Label htmlFor="password">Nueva Contraseña (Dejar en blanco para mantener la actual)</Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                placeholder="••••••••"
                            />
                            {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
                        </div>

                        {/* Asignar Complejo si es Empleado (Solo Superadmin) */}
                        {esSuperAdmin && esEmpleadoSeleccionado && (
                            <div className="space-y-2 p-4 border rounded-md bg-indigo-50/30 border-indigo-200/60">
                                <Label htmlFor="complejo_id" className="flex items-center gap-2 font-semibold">
                                    <Building2 className="w-4 h-4 text-indigo-600" />
                                    Complejo Asignado al Empleado
                                </Label>
                                {!data.complejo_id && (
                                    <p className="text-xs text-amber-700 font-medium">
                                        ⚠️ Este empleado aún no tiene un complejo asignado. Selecciónalo de la lista:
                                    </p>
                                )}
                                <select
                                    id="complejo_id"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={data.complejo_id}
                                    onChange={(e) => setData('complejo_id', e.target.value)}
                                >
                                    <option value="">-- Sin complejo asignado --</option>
                                    {complejos.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.nombre}
                                        </option>
                                    ))}
                                </select>
                                {errors.complejo_id && <p className="text-destructive text-sm">{errors.complejo_id}</p>}
                            </div>
                        )}

                        {/* Modificar Roles (Solo visible para Superadmin) */}
                        {esSuperAdmin && (
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Gestionar Roles Asignados</Label>
                                {errors.roles && (
                                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2 border border-destructive/20 animate-in fade-in-50 duration-200">
                                        <AlertTriangle className="w-4 h-4 shrink-0" />
                                        <span>{errors.roles}</span>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-md bg-muted/30">
                                    {roles.map((role) => (
                                        <div key={role.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`role-${role.id}`}
                                                checked={data.roles.includes(role.name)}
                                                onCheckedChange={(checked) => handleCheckboxChange(role.name, !!checked)}
                                            />
                                            <Label htmlFor={`role-${role.id}`} className="font-normal capitalize cursor-pointer">
                                                {role.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Botones de acción */}
                        <div className="flex gap-2 justify-end pt-4 border-t">
                            <Button variant="outline" asChild>
                                <Link href={'/users'}>Cancelar</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {esSuperAdmin ? 'Actualizar Usuario' : 'Actualizar Empleado'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}