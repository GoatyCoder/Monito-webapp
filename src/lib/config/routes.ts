import { UserRole } from '@/types/domain';

const BASE_ROUTES = [
  { label: 'Cruscotto', href: '/dashboard' },
  { label: 'Report', href: '/report' }
] as const;

const ADMIN_ROUTES = [{ label: 'Anagrafiche', href: '/anagrafiche' }] as const;

export function getAppRoutesByRole(role: UserRole) {
  if (role === 'admin') {
    return [...BASE_ROUTES, ...ADMIN_ROUTES];
  }

  return BASE_ROUTES;
}
