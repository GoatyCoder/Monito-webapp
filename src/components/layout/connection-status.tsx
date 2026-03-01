type ConnectionStatusProps = {
  mode: 'online' | 'offline' | 'syncing' | 'conflict';
};

export function ConnectionStatus({ mode }: ConnectionStatusProps) {
  // Mappa visuale allineata a Design.md, con badge per stati non-online.
  const map = {
    online: { label: '● Online', className: 'text-success' },
    offline: {
      label: '⚠ Offline — dati salvati localmente',
      className: 'rounded border border-accent bg-accent/10 px-2 py-0.5 text-accent'
    },
    syncing: {
      label: '↻ Sincronizzazione...',
      className: 'rounded border border-primary bg-primary/10 px-2 py-0.5 text-primary'
    },
    conflict: {
      label: '⛔ N conflitti da risolvere',
      className: 'rounded border border-error bg-error/10 px-2 py-0.5 text-error'
    }
  };

  const status = map[mode];
  return <span className={`text-xs font-medium ${status.className}`}>{status.label}</span>;
}
