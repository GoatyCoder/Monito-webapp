import Link from 'next/link';

import { ConnectionStatus } from '@/components/layout/connection-status';
import { APP_ROUTES } from '@/lib/config/routes';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-surface shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 p-4">
        {/* Brand applicazione. */}
        <div>
          <p className="text-lg font-bold text-primary">MONITO</p>
          <p className="text-xs text-secondary">Produzione Ortofrutticola</p>
        </div>

        {/* Menu principale placeholder. */}
        <nav className="flex items-center gap-3 text-sm">
          {APP_ROUTES.map((route) => (
            <Link key={route.href} href={route.href} className="text-secondary hover:text-primary">
              {route.label}
            </Link>
          ))}
        </nav>

        {/* Stato connessione e profilo utente (mock). */}
        <div className="flex items-center gap-3">
          <ConnectionStatus mode="online" />
          <span className="text-xs text-secondary">Utente Demo · Viewer</span>
        </div>
      </div>
    </header>
  );
}
