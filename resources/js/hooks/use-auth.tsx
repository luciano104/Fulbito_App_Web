import { usePage } from '@inertiajs/react';
export function useAuth() {
    const { auth } = usePage().props as any;
    const permissions: string[] = auth?.permissions || [];
    const roles: string[] = auth?.roles || [];

    // Retorna true si el usuario tiene el permiso solicitado 
    const can = (permission: string): boolean => {
        return permissions.includes(permission);
    };
    const hasRole = (role: string): boolean => {
        return roles.includes(role);
    }
    return { can, hasRole, roles, user: auth?.user };
}