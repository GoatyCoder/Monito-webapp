import { Badge } from '@/components/ui/badge';

type LineCardProps = {
  state: 'inactive' | 'active' | 'multi';
  canEdit: boolean;
};

const stateLabel: Record<LineCardProps['state'], string> = {
  inactive: 'INATTIVA',
  active: 'ATTIVA',
  multi: 'MULTI'
};

const stateBadgeVariant: Record<LineCardProps['state'], 'secondary' | 'success' | 'accent'> = {
  inactive: 'secondary',
  active: 'success',
  multi: 'accent'
};

export function LineCard({ state, canEdit }: LineCardProps) {
  const accent = state === 'inactive' ? 'border-secondary opacity-70' : state === 'active' ? 'border-success' : 'border-accent';

  return (
    <article className={`rounded-lg border-l-4 bg-surface p-4 shadow-sm ${accent}`}>
      {/* Badge stato aggiunto mantenendo il bordo laterale per coerenza visiva. */}
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Linea X</h2>
        <Badge variant={stateBadgeVariant[state]}>{stateLabel[state]}</Badge>
      </header>

      <p className="mb-4 text-sm text-secondary">Lotto, articolo, statistiche e azioni saranno collegate ai dati runtime.</p>

      {canEdit ? (
        <div className="flex flex-wrap gap-2">
          <button className="rounded bg-primary px-3 py-1.5 text-xs text-white">+ Pedana</button>
          <button className="rounded bg-error px-3 py-1.5 text-xs text-white">Chiudi</button>
          <button className="rounded border border-secondary px-3 py-1.5 text-xs text-secondary">Modifica</button>
        </div>
      ) : (
        <p className="text-xs text-secondary">Modalità sola lettura (Viewer).</p>
      )}
    </article>
  );
}
