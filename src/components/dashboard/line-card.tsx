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

      {/* Azioni placeholder (abilitazioni ruolo da implementare). */}
      <div className="flex flex-wrap gap-2">
        <button className="rounded bg-primary px-3 py-1.5 text-xs text-white">+ Pedana</button>
        <button className="rounded bg-error px-3 py-1.5 text-xs text-white">Chiudi</button>
        <button className="rounded border border-secondary px-3 py-1.5 text-xs text-secondary">Modifica</button>
      </div>
    </article>
  );
}
