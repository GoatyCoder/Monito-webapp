'use client';

// TODO: componente sostituito da new-work-order-modal — rimuovere dopo validazione

import { ChangeEvent, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

import { Input } from '@/components/ui/input';

import { dateFromDayOfYear, dayOfYearFromDate } from '@/lib/utils/date';

type NewWorkOrderFormProps = {
  canEdit: boolean;
};

export function NewWorkOrderForm({ canEdit }: NewWorkOrderFormProps) {
  const [siglaLotto, setSiglaLotto] = useState('');
  const [dataIngresso, setDataIngresso] = useState('');
  const [lottoIngressoDoy, setLottoIngressoDoy] = useState('');
  const [autoField, setAutoField] = useState<'date' | 'doy' | null>(null);

  const helperText = useMemo(() => {
    if (!dataIngresso && !lottoIngressoDoy) {
      return 'Inserisci una data o un DOY: il secondo campo viene compilato automaticamente.';
    }

    const year = new Date().getFullYear();
    return `Anno di conversione: ${year}`;
  }, [dataIngresso, lottoIngressoDoy]);

  const isSynced = Boolean(dataIngresso && lottoIngressoDoy && dayOfYearFromDate(dataIngresso) === Number(lottoIngressoDoy));

  const handleDataIngressoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextDate = event.target.value;
    setDataIngresso(nextDate);

    if (!nextDate) {
      setLottoIngressoDoy('');
      setAutoField(null);
      return;
    }

    const doy = dayOfYearFromDate(nextDate);
    setLottoIngressoDoy(doy ? String(doy).padStart(3, '0') : '');
    setAutoField('doy');
  };

  const handleDoyChange = (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value.replace(/\D/g, '').slice(0, 3);
    setLottoIngressoDoy(rawValue);

    if (!rawValue) {
      setDataIngresso('');
      setAutoField(null);
      return;
    }

    const year = new Date().getFullYear();
    const date = dateFromDayOfYear(Number(rawValue), year);
    setDataIngresso(date ?? '');
    setAutoField('date');
  };

  return (
    <form className="rounded-lg border border-secondary bg-surface p-4 shadow-sm">
      <header className="mb-4">
        <h2 className="text-lg font-semibold">Nuova lavorazione</h2>
        <p className="text-sm text-secondary">Workflow semplificato: sigla lotto + data ingresso/DOY.</p>
      </header>

      {canEdit ? (
        <div className="grid gap-4 md:grid-cols-3">
          {/* Input uniformati con shadcn/ui e check verde su compilazione automatica sincronizzata. */}
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Sigla lotto</span>
            <Input
              placeholder="Es. ALFA12"
              value={siglaLotto}
              onChange={(event) => setSiglaLotto(event.target.value.toUpperCase())}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Data ingresso</span>
            <div className="flex items-center gap-2">
              <Input type="date" value={dataIngresso} onChange={handleDataIngressoChange} />
              {isSynced && autoField === 'date' ? <CheckCircle2 className="h-5 w-5 text-success" /> : null}
            </div>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Lotto ingresso (DOY)</span>
            <div className="flex items-center gap-2">
              <Input
                inputMode="numeric"
                maxLength={3}
                placeholder="001-366"
                value={lottoIngressoDoy}
                onChange={handleDoyChange}
              />
              {isSynced && autoField === 'doy' ? <CheckCircle2 className="h-5 w-5 text-success" /> : null}
            </div>
          </label>
        </div>
      ) : (
        <p className="text-sm text-secondary">Modalità sola lettura: apertura lavorazioni disponibile solo per Admin e Operatore.</p>
      )}

      <p className="mt-3 text-xs text-secondary">{helperText}</p>
    </form>
  );
}
