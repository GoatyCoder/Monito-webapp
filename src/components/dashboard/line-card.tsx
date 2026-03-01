import { Button } from '@/components/common/button';

type LineCardProps = {
  state: 'inactive' | 'active' | 'multi';
};

export function LineCard({ state }: LineCardProps) {
  const accent =
    state === 'inactive'
      ? 'border-secondary opacity-70'
      : state === 'active'
        ? 'border-success'
        : 'border-accent';

  return (
    <article className={`rounded-lg border-l-4 bg-surface p-4 shadow-sm ${accent}`}>
      {/* Titolo card linea. */}
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Linea X</h2>
        <span className="text-xs text-secondary">{state.toUpperCase()}</span>
      </header>

      {/* Corpo placeholder: nessun dato reale. */}
      <p className="mb-4 text-sm text-secondary">Lotto, articolo, statistiche e azioni saranno collegate ai dati runtime.</p>

      {/* Azioni placeholder con Button centralizzato. */}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" className="px-3 py-1.5 text-xs">
          + Pedana
        </Button>
        <Button variant="danger" className="px-3 py-1.5 text-xs">
          Chiudi
        </Button>
        <Button variant="secondary" className="px-3 py-1.5 text-xs">
          Modifica
        </Button>
      </div>
    </article>
  );
}
