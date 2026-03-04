import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

type ConnectionStatusProps = {
  mode: 'online' | 'offline' | 'syncing' | 'conflict';
};

export function ConnectionStatus({ mode }: ConnectionStatusProps) {
  // Stato connessione reso più leggibile con badge e icone coerenti.
  const map = {
    online: { label: 'Online', icon: Wifi, variant: 'success' as const },
    offline: { label: 'Offline', icon: WifiOff, variant: 'accent' as const },
    syncing: { label: 'Sincronizzazione', icon: RefreshCw, variant: 'default' as const },
    conflict: { label: 'Conflitti', icon: AlertTriangle, variant: 'secondary' as const }
  };

  const current = map[mode];
  const Icon = current.icon;

  return (
    <Badge variant={current.variant} className="gap-1.5">
      <Icon className="h-3.5 w-3.5" />
      {current.label}
    </Badge>
  );
}
