'use client';

import { useEffect, useMemo, useState } from 'react';

import { Select } from '@/components/ui/select';
import { OPERATIVE_YEARS } from '@/lib/config/db';

type AvailableYear = (typeof OPERATIVE_YEARS)[number];

const STORAGE_KEY = 'monito:preferred-operative-year';

export default function SettingsPage() {
  const [selectedYear, setSelectedYear] = useState<AvailableYear>(OPERATIVE_YEARS[0]);

  useEffect(() => {
    const storedYear = window.localStorage.getItem(STORAGE_KEY);
    if (!storedYear) {
      return;
    }

    const parsedYear = Number(storedYear);
    if (OPERATIVE_YEARS.includes(parsedYear as AvailableYear)) {
      setSelectedYear(parsedYear as AvailableYear);
    }
  }, []);

  const selectedSchema = useMemo(() => `ops_${selectedYear}`, [selectedYear]);

  const handleYearChange = (year: AvailableYear) => {
    setSelectedYear(year);
    window.localStorage.setItem(STORAGE_KEY, String(year));
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Impostazioni</h1>
        <p className="text-sm text-slate-600">Configura le preferenze operative dell&apos;interfaccia Monito.</p>
      </header>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Impostazioni operative</h2>
        <p className="mt-1 text-sm text-slate-600">Seleziona l&apos;anno operativo da usare come riferimento in interfaccia.</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Anno operativo
            <Select
              className="mt-1"
              value={String(selectedYear)}
              onChange={(event) => handleYearChange(Number(event.target.value) as AvailableYear)}
            >
              {OPERATIVE_YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </label>

          <div>
            <p className="text-sm font-medium text-slate-700">Schema operativo selezionato</p>
            <p className="mt-1 rounded bg-slate-50 px-3 py-2 text-sm text-slate-700">{selectedSchema}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
