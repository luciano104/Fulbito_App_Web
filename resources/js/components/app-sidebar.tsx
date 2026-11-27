import { Link } from '@inertiajs/react';
import { Building2, CalendarCheck, Clock, Grid, LayoutGrid, Users } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import { useAuth } from '@/hooks/use-auth';

type ExtendedNavItem = NavItem & {
    permission?: string;
    role?: string;
};

const mainNavItems: ExtendedNavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Complejos',
        href: '/complejos',
        icon: Building2,
        role: 'super-admin',
    },
    {
        title: 'Usuarios',
        href: '/users',
        icon: Users,
        permission: 'listar usuarios',
    },
    {
        title: 'Canchas',
        href: '/canchas',
        icon: Grid,
        permission: 'listar canchas',
    },
    {
        title: 'Horarios',
        href: '/horarios',
        icon: Clock,
        permission: 'listar horarios',
    },
    {
        title: 'Reservas',
        href: '/reservas',
        icon: CalendarCheck,
        permission: 'listar reservas',
    },
];

export function AppSidebar() {
    const { can, hasRole } = useAuth();

    const filteredNavItems = mainNavItems.filter((item) => {
        if (item.role && !hasRole(item.role)) {
            return false;
        }
        return !item.permission || can(item.permission);
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}