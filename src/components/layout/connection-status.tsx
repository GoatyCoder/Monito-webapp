type ConnectionStatusProps = {
  mode: 'online' | 'offline' | 'syncing' | 'conflict';
};

export function ConnectionStatus({ mode }: ConnectionStatusProps) {
  // Mappa visuale minima, da sostituire con stato reale rete/sync.
  const map = {
    online: { label: '● Online', className: 'text-success' },
    offline: { label: '⚠ Offline', className: 'text-accent' },
    syncing: { label: '↻ Sincronizzazione...', className: 'text-primary' },
    conflict: { label: '⛔ Conflitti', className: 'text-error' }
  };

  return <span className={`text-xs font-medium ${map[mode].className}`}>{map[mode].label}</span>;
}
