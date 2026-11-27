import { useForm, Link, usePage } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Sparkles, UserPlus } from 'lucide-react';

interface Role {
    id: number;
    name: string;
}

interface Complejo {
    id: number;
    nombre: string;
}

interface CreateProps {
    roles: Role[];
    complejos?: Complejo[];
    miComplejo?: Complejo | null;
}

export default function Create({ roles, complejos = [], miComplejo = null }: CreateProps) {
    const { props } = usePage<any>();
    const authRoles: string[] = props.auth?.user?.roles?.map((r: any) => r.name ?? r) ?? [];
    const esAdmin = authRoles.includes('admin') && !authRoles.includes('super-admin');
    const esSuperAdmin = authRoles.includes('super-admin');

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: esAdmin ? ['empleado'] : ([] as string[]),
        complejo_id: miComplejo ? String(miComplejo.id) : '',
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

    const cargarDatosPorDefecto = () => {
        const nombreComplejo = miComplejo?.nombre || 'Complejo';
        const slug = nombreComplejo
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '') || 'complejo';
        const sufijo = Math.floor(100 + Math.random() * 900);

        setData((prev) => ({
            ...prev,
            name: `Empleado - ${nombreComplejo}`,
            email: `empleado.${slug}${sufijo}@fulbito.com`,
            password: 'empleado123',
            password_confirmation: 'empleado123',
            roles: ['empleado'],
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/users');
    };

    const esEmpleadoSeleccionado = data.roles.includes('empleado');

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <Card className="shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-indigo-600" />
                            {esAdmin ? 'Agregar Empleado' : 'Registrar Nuevo Usuario'}
                        </CardTitle>
                        <CardDescription className="mt-1">
                            {esAdmin
                                ? `El nuevo empleado quedará vinculado automáticamente a ${miComplejo?.nombre ?? 'tu complejo'}.`
                                : 'Completa los datos personales y asigna los roles correspondientes.'}
                        </CardDescription>
                    </div>

                    {esAdmin && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={cargarDatosPorDefecto}
                            className="border-amber-300 bg-amber-50/70 text-amber-900 hover:bg-amber-100 shrink-0"
                        >
                            <Sparkles className="w-4 h-4 mr-1.5 text-amber-600" />
                            Cargar datos por defecto
                        </Button>
                    )}
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {esAdmin && (
                            <div className="p-3 rounded-md bg-muted/40 border text-xs text-muted-foreground">
                                Si utilizas <strong>"Cargar datos por defecto"</strong>, se completará con contraseña inicial <code>empleado123</code> y la cuenta quedará marcada con aviso para que personalices sus datos más adelante.
                            </div>
                        )}

                        {/* Datos Básicos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre Completo</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder={esAdmin ? 'Ej: Martín Gómez' : 'Juan Pérez'}
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
                                    placeholder={esAdmin ? 'empleado@gmail.com' : 'juan@ejemplo.com'}
                                />
                                {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                            </div>
                        </div>

                        {/* Contraseñas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                />
                                {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirmar Contraseña</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={e => setData('password_confirmation', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Selector de Complejo si es Empleado (Solo Superadmin) */}
                        {esSuperAdmin && esEmpleadoSeleccionado && (
                            <div className="space-y-2 p-4 border rounded-md bg-indigo-50/30 border-indigo-200/60">
                                <Label htmlFor="complejo_id" className="flex items-center gap-2 font-semibold">
                                    <Building2 className="w-4 h-4 text-indigo-600" />
                                    Complejo Asignado al Empleado
                                </Label>
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

                        {/* Listado de Roles (Solo visible para Superadmin) */}
                        {esSuperAdmin && (
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Asignar Roles del Sistema</Label>
                                {errors.roles && <p className="text-destructive text-sm">{errors.roles}</p>}
                                {roles.length === 0 ? (
                                    <p className="text-sm italic text-muted-foreground">No hay roles creados en el sistema.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-md bg-muted/30">
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
                                )}
                            </div>
                        )}

                        {/* Botones de acción */}
                        <div className="flex gap-2 justify-end pt-4 border-t">
                            <Button variant="outline" asChild>
                                <Link href={'/users'}>Cancelar</Link>
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                {esAdmin ? 'Agregar Empleado' : 'Registrar'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}