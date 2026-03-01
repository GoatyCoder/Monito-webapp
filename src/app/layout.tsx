import type { Metadata } from 'next';
import './globals.css';

import { AppHeader } from '@/components/layout/app-header';

export const metadata: Metadata = {
  title: 'Monito',
  description: 'Sistema di monitoraggio produzione ortofrutticola'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        {/* Header globale applicazione (placeholder). */}
        <AppHeader />

        {/* Area contenuto principale per pagine route-based. */}
        <main className="mx-auto min-h-screen max-w-7xl p-6">{children}</main>
      </body>
    </html>
  );
}
