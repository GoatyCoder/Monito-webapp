import { AlertTriangle, Boxes, Package } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DashboardLavorazioneItem } from '@/lib/db/queries/lavorazioni';

type LineCardProps = {
  lineName: string;
  lavorazioni: DashboardLavorazioneItem[];
  canEdit: boolean;
  busyId: string | null;
  onClose: (lavorazioneId: string) => void;
  onEdit: (lavorazione: DashboardLavorazioneItem) => void;
};

export function LineCard({ lineName, lavorazioni, canEdit, busyId, onClose, onEdit }: LineCardProps) {
  const state = lavorazioni.length === 0 ? 'inactive' : lavorazioni.length === 1 ? 'active' : 'multi';
  const accent = state === 'inactive' ? 'border-slate-300' : state === 'active' ? 'border-emerald-500' : 'border-amber-400';

  return (
    <article className={`rounded-xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm ${accent}`}>
      <header className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{lineName}</h2>
          <p className="text-xs text-slate-500">
            {lavorazioni.length === 0 ? 'Nessuna lavorazione aperta' : `${lavorazioni.length} lavorazione/i attiva/e`}
          </p>
        </div>

        {state === 'inactive' ? <Badge variant="secondary">INATTIVA</Badge> : null}
        {state === 'active' ? <Badge variant="success">ATTIVA</Badge> : null}
        {state === 'multi' ? <Badge variant="accent">⚠ MULTI-LAVORAZIONE</Badge> : null}
      </header>

      {lavorazioni.length === 0 ? <p className="text-sm text-slate-500">Linea pronta per una nuova apertura.</p> : null}

      <div className="space-y-3">
        {lavorazioni.map((lavorazione) => (
          <section key={lavorazione.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">Lotto {lavorazione.lottoLabel}</p>
                <p className="text-xs text-slate-600">{lavorazione.articoloNome}</p>
              </div>
              {state === 'multi' ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : null}
            </div>

            <div className="mb-3 grid grid-cols-3 gap-2 text-xs text-slate-600">
              <p className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5" /> {lavorazione.pedaneCount}
              </p>
              <p className="flex items-center gap-1">
                <Boxes className="h-3.5 w-3.5" /> {lavorazione.colliTotali}
              </p>
              <p className="text-right font-medium">{lavorazione.pesoTotaleKg.toLocaleString('it-IT', { maximumFractionDigits: 1 })} kg</p>
            </div>

            {canEdit ? (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled>
                  + Pedana
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busyId === lavorazione.id}
                  onClick={() => onClose(lavorazione.id)}
                >
                  {busyId === lavorazione.id ? 'Chiusura…' : 'Chiudi'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => onEdit(lavorazione)}>
                  Modifica
                </Button>
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </article>
  );
}
