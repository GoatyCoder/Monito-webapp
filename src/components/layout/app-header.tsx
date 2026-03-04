import { ConnectionStatus } from '@/components/layout/connection-status';
import { NavLink } from '@/components/layout/nav-link';
import { UserMenu } from '@/components/layout/user-menu';
import { mapAuthUser } from '@/lib/auth/user';
import { getAppRoutesByRole } from '@/lib/config/routes';
import { createSupabaseServerClient } from '@/lib/db/supabase-server';

export async function AppHeader() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const authUser = user ? mapAuthUser(user) : null;
  const routes = getAppRoutesByRole(authUser?.role ?? 'viewer');

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-surface shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 p-4">
        {/* Header aggiornato con link attivo per migliorare l'orientamento navigazione. */}
        <div>
          <p className="text-lg font-bold text-primary">MONITO</p>
          <p className="text-xs text-secondary">Produzione Ortofrutticola</p>
        </div>

        <nav className="flex items-center gap-3 text-sm">
          {routes.map((route) => (
            <NavLink key={route.href} href={route.href} label={route.label} />
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ConnectionStatus mode="online" />
          {authUser && <UserMenu displayName={authUser.displayName} role={authUser.role} />}
        </div>
      </div>
    </header>
  );
}
