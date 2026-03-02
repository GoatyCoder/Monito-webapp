'use client';

import { ChangeEvent, useMemo, useState } from 'react';

const DAY_MS = 1000 * 60 * 60 * 24;

function dayOfYearFromDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const yearStart = new Date(Date.UTC(year, 0, 1));
  const diff = date.getTime() - yearStart.getTime();

  return Math.floor(diff / DAY_MS) + 1;
}

function dateFromDayOfYear(dayOfYear: number, year: number) {
  if (!Number.isInteger(dayOfYear) || dayOfYear < 1 || dayOfYear > 366) {
    return null;
  }

  const date = new Date(Date.UTC(year, 0, dayOfYear));
  if (date.getUTCFullYear() !== year) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

export function NewWorkOrderForm() {
  const [siglaLotto, setSiglaLotto] = useState('');
  const [dataIngresso, setDataIngresso] = useState('');
  const [lottoIngressoDoy, setLottoIngressoDoy] = useState('');

  const helperText = useMemo(() => {
    if (!dataIngresso && !lottoIngressoDoy) {
      return 'Inserisci una data o un DOY: il secondo campo viene compilato automaticamente.';
    }

    const year = new Date().getFullYear();
    return `Anno di conversione: ${year}`;
  }, [dataIngresso, lottoIngressoDoy]);

  const handleDataIngressoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextDate = event.target.value;
    setDataIngresso(nextDate);

    if (!nextDate) {
      setLottoIngressoDoy('');
      return;
    }

    const doy = dayOfYearFromDate(nextDate);
    setLottoIngressoDoy(doy ? String(doy).padStart(3, '0') : '');
  };

  const handleDoyChange = (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value.replace(/\D/g, '').slice(0, 3);
    setLottoIngressoDoy(rawValue);

    if (!rawValue) {
      setDataIngresso('');
      return;
    }

    const year = new Date().getFullYear();
    const date = dateFromDayOfYear(Number(rawValue), year);
    setDataIngresso(date ?? '');
  };

  return (
    <form className="rounded-lg border border-secondary bg-surface p-4 shadow-sm">
      <header className="mb-4">
        <h2 className="text-lg font-semibold">Nuova lavorazione</h2>
        <p className="text-sm text-secondary">Workflow semplificato: sigla lotto + data ingresso/DOY.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Sigla lotto</span>
          <input
            className="rounded border border-secondary bg-white px-3 py-2"
            placeholder="Es. ALFA12"
            value={siglaLotto}
            onChange={(event) => setSiglaLotto(event.target.value.toUpperCase())}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Data ingresso</span>
          <input
            className="rounded border border-secondary bg-white px-3 py-2"
            type="date"
            value={dataIngresso}
            onChange={handleDataIngressoChange}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Lotto ingresso (DOY)</span>
          <input
            className="rounded border border-secondary bg-white px-3 py-2"
            inputMode="numeric"
            maxLength={3}
            placeholder="001-366"
            value={lottoIngressoDoy}
            onChange={handleDoyChange}
          />
        </label>
      </div>

      <p className="mt-3 text-xs text-secondary">{helperText}</p>
    </form>
  );
}
