'use client';

import { useMemo, useState } from 'react';

type RegistryKey =
  | 'linee'
  | 'prodotti'
  | 'varieta'
  | 'imballaggi'
  | 'articoli'
  | 'sigleLotto'
  | 'lottiIngresso';

type RegistryItem = {
  id: string;
  codice: string;
  nome: string;
  categoria: string;
  stato: 'Attivo' | 'Disattivato';
  aggiornatoDa: string;
  aggiornatoIl: string;
};

type RegistryConfig = {
  key: RegistryKey;
  label: string;
  description: string;
  columns: Array<{ key: keyof RegistryItem; label: string }>;
  data: RegistryItem[];
};

const registryConfigs: RegistryConfig[] = [
  {
    key: 'linee',
    label: 'Linee',
    description: 'Linee produttive ordinate e gestibili con soft delete.',
    columns: [
      { key: 'codice', label: 'Codice linea' },
      { key: 'nome', label: 'Descrizione' },
      { key: 'categoria', label: 'Area' },
      { key: 'stato', label: 'Stato' },
      { key: 'aggiornatoDa', label: 'Aggiornato da' },
      { key: 'aggiornatoIl', label: 'Ultimo aggiornamento' }
    ],
    data: [
      { id: 'l1', codice: 'LINEA-01', nome: 'Confezionamento Nord', categoria: 'Confezionamento', stato: 'Attivo', aggiornatoDa: 'Admin', aggiornatoIl: '2026-02-21' },
      { id: 'l2', codice: 'LINEA-02', nome: 'Confezionamento Sud', categoria: 'Confezionamento', stato: 'Attivo', aggiornatoDa: 'Admin', aggiornatoIl: '2026-02-20' },
      { id: 'l3', codice: 'LINEA-03', nome: 'Linea test stagionale', categoria: 'Sperimentale', stato: 'Disattivato', aggiornatoDa: 'Admin', aggiornatoIl: '2026-02-14' },
      { id: 'l4', codice: 'LINEA-04', nome: 'Calibrazione export', categoria: 'Calibratura', stato: 'Attivo', aggiornatoDa: 'Lucia', aggiornatoIl: '2026-02-26' }
    ]
  },
  {
    key: 'prodotti',
    label: 'Prodotti grezzi',
    description: 'Categorie merceologiche disponibili a catalogo.',
    columns: [
      { key: 'codice', label: 'Codice' },
      { key: 'nome', label: 'Prodotto' },
      { key: 'categoria', label: 'Filiera' },
      { key: 'stato', label: 'Stato' },
      { key: 'aggiornatoDa', label: 'Aggiornato da' },
      { key: 'aggiornatoIl', label: 'Ultimo aggiornamento' }
    ],
    data: [
      { id: 'p1', codice: 'PG-001', nome: 'Uva da Tavola', categoria: 'Frutta fresca', stato: 'Attivo', aggiornatoDa: 'Admin', aggiornatoIl: '2026-02-25' },
      { id: 'p2', codice: 'PG-002', nome: 'Agrumi', categoria: 'Frutta fresca', stato: 'Attivo', aggiornatoDa: 'Franco', aggiornatoIl: '2026-02-18' },
      { id: 'p3', codice: 'PG-003', nome: 'Melograno', categoria: 'Frutta premium', stato: 'Disattivato', aggiornatoDa: 'Admin', aggiornatoIl: '2026-01-29' }
    ]
  },
  {
    key: 'varieta',
    label: 'Varietà',
    description: 'Cultivar collegate ai prodotti grezzi.',
    columns: [
      { key: 'codice', label: 'Codice varietà' },
      { key: 'nome', label: 'Varietà' },
      { key: 'categoria', label: 'Prodotto grezzo' },
      { key: 'stato', label: 'Stato' },
      { key: 'aggiornatoDa', label: 'Aggiornato da' },
      { key: 'aggiornatoIl', label: 'Ultimo aggiornamento' }
    ],
    data: [
      { id: 'v1', codice: 'VAR-001', nome: 'Crimson', categoria: 'Uva da Tavola', stato: 'Attivo', aggiornatoDa: 'Lucia', aggiornatoIl: '2026-02-24' },
      { id: 'v2', codice: 'VAR-002', nome: 'Italia', categoria: 'Uva da Tavola', stato: 'Attivo', aggiornatoDa: 'Admin', aggiornatoIl: '2026-02-21' },
      { id: 'v3', codice: 'VAR-003', nome: 'Navelina', categoria: 'Agrumi', stato: 'Attivo', aggiornatoDa: 'Franco', aggiornatoIl: '2026-02-10' }
    ]
  },
  {
    key: 'imballaggi',
    label: 'Imballaggi secondari',
    description: 'Formati di confezionamento utilizzabili in lavorazione.',
    columns: [
      { key: 'codice', label: 'Codice imballaggio' },
      { key: 'nome', label: 'Nome' },
      { key: 'categoria', label: 'Formato' },
      { key: 'stato', label: 'Stato' },
      { key: 'aggiornatoDa', label: 'Aggiornato da' },
      { key: 'aggiornatoIl', label: 'Ultimo aggiornamento' }
    ],
    data: [
      { id: 'i1', codice: 'IMB-500', nome: 'Cartone 40x60', categoria: 'Standard', stato: 'Attivo', aggiornatoDa: 'Admin', aggiornatoIl: '2026-02-22' },
      { id: 'i2', codice: 'IMB-750', nome: 'Vassoio flow-pack', categoria: 'Retail', stato: 'Attivo', aggiornatoDa: 'Lucia', aggiornatoIl: '2026-02-11' },
      { id: 'i3', codice: 'IMB-900', nome: 'Cassetta legno premium', categoria: 'Premium', stato: 'Disattivato', aggiornatoDa: 'Admin', aggiornatoIl: '2026-01-25' }
    ]
  },
  {
    key: 'articoli',
    label: 'Articoli',
    description: 'Prodotti finiti con vincoli su prodotto grezzo e varietà.',
    columns: [
      { key: 'codice', label: 'Codice articolo' },
      { key: 'nome', label: 'Articolo' },
      { key: 'categoria', label: 'Vincolo' },
      { key: 'stato', label: 'Stato' },
      { key: 'aggiornatoDa', label: 'Aggiornato da' },
      { key: 'aggiornatoIl', label: 'Ultimo aggiornamento' }
    ],
    data: [
      { id: 'a1', codice: 'ART-001', nome: 'Uva Bianca 500g', categoria: 'Uva da Tavola / Italia', stato: 'Attivo', aggiornatoDa: 'Admin', aggiornatoIl: '2026-02-27' },
      { id: 'a2', codice: 'ART-002', nome: 'Uva Rossa 1kg', categoria: 'Uva da Tavola / Crimson', stato: 'Attivo', aggiornatoDa: 'Lucia', aggiornatoIl: '2026-02-24' },
      { id: 'a3', codice: 'ART-003', nome: 'Mix agrumi 2kg', categoria: 'Agrumi / Any', stato: 'Disattivato', aggiornatoDa: 'Admin', aggiornatoIl: '2026-02-01' }
    ]
  },
  {
    key: 'sigleLotto',
    label: 'Sigle lotto',
    description: 'Partite configurabili per produttore e cultivar.',
    columns: [
      { key: 'codice', label: 'Sigla' },
      { key: 'nome', label: 'Produttore' },
      { key: 'categoria', label: 'Composizione' },
      { key: 'stato', label: 'Stato' },
      { key: 'aggiornatoDa', label: 'Aggiornato da' },
      { key: 'aggiornatoIl', label: 'Ultimo aggiornamento' }
    ],
    data: [
      { id: 's1', codice: '2012', nome: 'Azienda Verde', categoria: 'Uva da Tavola / Italia / Campo A', stato: 'Attivo', aggiornatoDa: 'Admin', aggiornatoIl: '2026-02-19' },
      { id: 's2', codice: '2099', nome: 'Fratelli Sole', categoria: 'Uva da Tavola / Crimson / Campo C', stato: 'Attivo', aggiornatoDa: 'Franco', aggiornatoIl: '2026-02-13' },
      { id: 's3', codice: '1880', nome: 'Pianura Sud', categoria: 'Agrumi / Navelina / Lotto 2', stato: 'Disattivato', aggiornatoDa: 'Admin', aggiornatoIl: '2026-01-30' }
    ]
  },
  {
    key: 'lottiIngresso',
    label: 'Lotti ingresso',
    description: 'Conferimenti fisici tracciabili con sigla + DOY.',
    columns: [
      { key: 'codice', label: 'Lotto ingresso' },
      { key: 'nome', label: 'Produttore' },
      { key: 'categoria', label: 'Composizione' },
      { key: 'stato', label: 'Stato' },
      { key: 'aggiornatoDa', label: 'Aggiornato da' },
      { key: 'aggiornatoIl', label: 'Ultimo aggiornamento' }
    ],
    data: [
      { id: 'li1', codice: '2012-041', nome: 'Azienda Verde', categoria: 'Uva Italia · DOY 041', stato: 'Attivo', aggiornatoDa: 'Admin', aggiornatoIl: '2026-02-10' },
      { id: 'li2', codice: '2012-042', nome: 'Azienda Verde', categoria: 'Uva Italia · DOY 042', stato: 'Attivo', aggiornatoDa: 'Lucia', aggiornatoIl: '2026-02-11' },
      { id: 'li3', codice: '2099-053', nome: 'Fratelli Sole', categoria: 'Uva Crimson · DOY 053', stato: 'Attivo', aggiornatoDa: 'Franco', aggiornatoIl: '2026-02-22' },
      { id: 'li4', codice: '1880-021', nome: 'Pianura Sud', categoria: 'Agrumi Navelina · DOY 021', stato: 'Disattivato', aggiornatoDa: 'Admin', aggiornatoIl: '2026-01-28' }
    ]
  }
];

const pageSizeOptions = [5, 10, 20];

export default function AnagrafichePage() {
  const [activeTab, setActiveTab] = useState<RegistryKey>('linee');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'tutti' | RegistryItem['stato']>('tutti');
  const [updatedByFilter, setUpdatedByFilter] = useState('tutti');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState<keyof RegistryItem>('aggiornatoIl');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);

  const config = registryConfigs.find((registry) => registry.key === activeTab) ?? registryConfigs[0];

  const updatedByOptions = useMemo(() => {
    const set = new Set(config.data.map((item) => item.aggiornatoDa));
    return ['tutti', ...Array.from(set)];
  }, [config]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return config.data
      .filter((item) => {
        if (!normalizedSearch) {
          return true;
        }

        return [item.codice, item.nome, item.categoria].some((value) => value.toLowerCase().includes(normalizedSearch));
      })
      .filter((item) => (statusFilter === 'tutti' ? true : item.stato === statusFilter))
      .filter((item) => (updatedByFilter === 'tutti' ? true : item.aggiornatoDa === updatedByFilter))
      .filter((item) => (fromDate ? item.aggiornatoIl >= fromDate : true))
      .filter((item) => (toDate ? item.aggiornatoIl <= toDate : true))
      .sort((a, b) => {
        const left = String(a[sortBy]);
        const right = String(b[sortBy]);
        const result = left.localeCompare(right, 'it', { numeric: true });
        return sortDirection === 'asc' ? result : -result;
      });
  }, [config, fromDate, search, sortBy, sortDirection, statusFilter, toDate, updatedByFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  const pagedRows = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize, totalPages]);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('tutti');
    setUpdatedByFilter('tutti');
    setFromDate('');
    setToDate('');
    setSortBy('aggiornatoIl');
    setSortDirection('desc');
    setPage(1);
    setPageSize(5);
  };

  return (
    <section className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Anagrafiche</h1>
        <p className="mt-2 max-w-3xl text-sm text-secondary">
          Gestione centralizzata delle anagrafiche Monito con tab dedicate, filtri avanzati, ordinamento multi-colonna e paginazione.
        </p>
      </header>

      <div className="rounded-lg border border-slate-200 bg-surface p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {registryConfigs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(1);
                  setSearch('');
                  setStatusFilter('tutti');
                  setUpdatedByFilter('tutti');
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-primary text-white shadow' : 'bg-slate-100 text-secondary hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <article className="space-y-4 rounded-lg border border-slate-200 bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{config.label}</h2>
            <p className="text-sm text-secondary">{config.description}</p>
          </div>
          <button
            type="button"
            className="rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary transition hover:bg-blue-50"
          >
            + Nuova anagrafica
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-lg bg-background p-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-secondary">
            Ricerca
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Codice, nome, categoria..."
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 outline-none ring-primary transition focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-secondary">
            Stato
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as 'tutti' | RegistryItem['stato']);
                setPage(1);
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none ring-primary transition focus:ring-2"
            >
              <option value="tutti">Tutti</option>
              <option value="Attivo">Attivo</option>
              <option value="Disattivato">Disattivato</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-secondary">
            Aggiornato da
            <select
              value={updatedByFilter}
              onChange={(event) => {
                setUpdatedByFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none ring-primary transition focus:ring-2"
            >
              {updatedByOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'tutti' ? 'Tutti' : option}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-secondary">
              Da data
              <input
                type="date"
                value={fromDate}
                onChange={(event) => {
                  setFromDate(event.target.value);
                  setPage(1);
                }}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 outline-none ring-primary transition focus:ring-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-secondary">
              A data
              <input
                type="date"
                value={toDate}
                onChange={(event) => {
                  setToDate(event.target.value);
                  setPage(1);
                }}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 outline-none ring-primary transition focus:ring-2"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-secondary">
            Ordina per
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as keyof RegistryItem)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none ring-primary transition focus:ring-2"
            >
              {config.columns.map((column) => (
                <option key={column.key} value={column.key}>
                  {column.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-secondary">
            Direzione
            <select
              value={sortDirection}
              onChange={(event) => setSortDirection(event.target.value as 'asc' | 'desc')}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none ring-primary transition focus:ring-2"
            >
              <option value="asc">Crescente</option>
              <option value="desc">Decrescente</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-secondary">
            Righe per pagina
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none ring-primary transition focus:ring-2"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={resetFilters}
            className="self-end rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-secondary transition hover:bg-slate-100"
          >
            Reset filtri
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {config.columns.map((column) => (
                  <th key={column.key} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {pagedRows.length > 0 ? (
                pagedRows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-slate-50">
                    {config.columns.map((column) => (
                      <td key={column.key} className="whitespace-nowrap px-3 py-3 text-slate-700">
                        {column.key === 'stato' ? (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              row.stato === 'Attivo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {row.stato}
                          </span>
                        ) : (
                          row[column.key]
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={config.columns.length} className="px-3 py-8 text-center text-secondary">
                    Nessun risultato con i filtri selezionati.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-200 pt-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-secondary">
            {filteredRows.length} record trovati · Pagina {Math.min(page, totalPages)} di {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-secondary transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Precedente
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-secondary transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Successiva
            </button>
          </div>
        </footer>
      </article>
    </section>
  );
}
