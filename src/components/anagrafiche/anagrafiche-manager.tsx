'use client';

import { useMemo, useState } from 'react';

type SortDirection = 'asc' | 'desc' | null;
type EntityType = 'linee' | 'prodotti' | 'varieta' | 'imballaggi' | 'articoli' | 'sigleLotto';

type CellValue = string | number | boolean | null;
type GenericRow = { id: string; isActive: boolean; values: Record<string, CellValue> };
type Column = { key: string; label: string; minWidth?: string };

type EntityConfig = {
  label: string;
  columns: Column[];
  rows: GenericRow[];
};

const ENTITY_CONFIG: Record<EntityType, EntityConfig> = {
  linee: {
    label: 'Linee',
    columns: [
      { key: 'nome', label: 'Nome', minWidth: 'min-w-52' },
      { key: 'descrizione', label: 'Descrizione', minWidth: 'min-w-80' },
      { key: 'ordine', label: 'Ordine', minWidth: 'min-w-24' }
    ],
    rows: [
      { id: 'l1', isActive: true, values: { nome: 'Linea 1', descrizione: 'Confezionamento uva bianca premium', ordine: 1 } },
      { id: 'l2', isActive: true, values: { nome: 'Linea 2', descrizione: 'Confezionamento albicocche export', ordine: 2 } },
      { id: 'l3', isActive: false, values: { nome: 'Linea 3', descrizione: 'Linea riserva', ordine: 3 } }
    ]
  },
  prodotti: {
    label: 'Prodotti Grezzi',
    columns: [
      { key: 'nome', label: 'Nome', minWidth: 'min-w-52' },
      { key: 'descrizione', label: 'Descrizione', minWidth: 'min-w-80' }
    ],
    rows: [
      { id: 'p1', isActive: true, values: { nome: 'Uva da Tavola', descrizione: 'Materia prima principale' } },
      { id: 'p2', isActive: true, values: { nome: 'Albicocca', descrizione: 'Produzione estiva' } },
      { id: 'p3', isActive: false, values: { nome: 'Melograno', descrizione: 'Produzione spot' } }
    ]
  },
  varieta: {
    label: 'Varietà',
    columns: [
      { key: 'nome', label: 'Nome', minWidth: 'min-w-52' },
      { key: 'prodottoGrezzo', label: 'Prodotto Grezzo', minWidth: 'min-w-52' },
      { key: 'descrizione', label: 'Descrizione', minWidth: 'min-w-80' }
    ],
    rows: [
      { id: 'v1', isActive: true, values: { nome: 'Italia', prodottoGrezzo: 'Uva da Tavola', descrizione: 'Export premium' } },
      { id: 'v2', isActive: true, values: { nome: 'Red Globe', prodottoGrezzo: 'Uva da Tavola', descrizione: 'Varietà rossa' } },
      { id: 'v3', isActive: false, values: { nome: 'Fantasy', prodottoGrezzo: 'Uva da Tavola', descrizione: 'Non più in uso' } }
    ]
  },
  imballaggi: {
    label: 'Imballaggi Secondari',
    columns: [
      { key: 'nome', label: 'Nome', minWidth: 'min-w-52' },
      { key: 'taraKg', label: 'Tara (kg)', minWidth: 'min-w-28' },
      { key: 'dimensioni', label: 'Dimensioni', minWidth: 'min-w-44' },
      { key: 'descrizione', label: 'Descrizione', minWidth: 'min-w-80' }
    ],
    rows: [
      { id: 'i1', isActive: true, values: { nome: 'Cartone 40x60', taraKg: 0.8, dimensioni: '40x60x25', descrizione: 'Formato standard' } },
      { id: 'i2', isActive: true, values: { nome: 'Bins Plastica', taraKg: 2.6, dimensioni: '120x100x80', descrizione: 'Bulk' } },
      { id: 'i3', isActive: false, values: { nome: 'Cassa Legno', taraKg: 1.4, dimensioni: '50x30x20', descrizione: 'Premium' } }
    ]
  },
  articoli: {
    label: 'Articoli',
    columns: [
      { key: 'nome', label: 'Nome', minWidth: 'min-w-52' },
      { key: 'pesoPerCollo', label: 'Peso/Collo (kg)', minWidth: 'min-w-36' },
      { key: 'pesoVariabile', label: 'Peso Variabile', minWidth: 'min-w-36' },
      { key: 'vincoloProdotto', label: 'Vincolo Prodotto', minWidth: 'min-w-44' },
      { key: 'vincoloVarieta', label: 'Vincolo Varietà', minWidth: 'min-w-44' }
    ],
    rows: [
      { id: 'a1', isActive: true, values: { nome: 'Uva Bianca 500g', pesoPerCollo: 0.5, pesoVariabile: false, vincoloProdotto: 'Uva da Tavola', vincoloVarieta: 'Italia' } },
      { id: 'a2', isActive: true, values: { nome: 'Albicocca 750g', pesoPerCollo: 0.75, pesoVariabile: true, vincoloProdotto: 'Albicocca', vincoloVarieta: '-' } },
      { id: 'a3', isActive: false, values: { nome: 'Uva Mix 1.2kg', pesoPerCollo: 1.2, pesoVariabile: false, vincoloProdotto: 'Uva da Tavola', vincoloVarieta: '-' } }
    ]
  },
  sigleLotto: {
    label: 'Sigle Lotto',
    columns: [
      { key: 'codice', label: 'Codice', minWidth: 'min-w-24' },
      { key: 'produttore', label: 'Produttore', minWidth: 'min-w-44' },
      { key: 'prodottoGrezzo', label: 'Prodotto Grezzo', minWidth: 'min-w-44' },
      { key: 'varieta', label: 'Varietà', minWidth: 'min-w-44' },
      { key: 'campo', label: 'Campo', minWidth: 'min-w-36' }
    ],
    rows: [
      { id: 's1', isActive: true, values: { codice: '2012', produttore: 'Rossi', prodottoGrezzo: 'Uva da Tavola', varieta: 'Italia', campo: 'A1' } },
      { id: 's2', isActive: true, values: { codice: '2088', produttore: 'Bianchi', prodottoGrezzo: 'Albicocca', varieta: 'Mikado', campo: 'C3' } },
      { id: 's3', isActive: false, values: { codice: '1740', produttore: 'Neri', prodottoGrezzo: 'Uva da Tavola', varieta: 'Red Globe', campo: 'B2' } }
    ]
  }
};

const PAGE_SIZES = [5, 10, 20] as const;

function compareValues(a: string, b: string) {
  return a.localeCompare(b, 'it', { sensitivity: 'base' });
}

function nextSort(direction: SortDirection): SortDirection {
  if (direction === null) return 'asc';
  if (direction === 'asc') return 'desc';
  return null;
}

function formatCell(value: CellValue): string {
  if (typeof value === 'boolean') return value ? 'Sì' : 'No';
  if (value === null) return '-';
  return String(value);
}

export function AnagraficheManager() {
  const [entityType, setEntityType] = useState<EntityType>('linee');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);

  const config = ENTITY_CONFIG[entityType];

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return config.rows.filter((row) => {
      const searchMatch =
        q.length === 0 ||
        Object.values(row.values)
          .map((v) => formatCell(v).toLowerCase())
          .join(' ')
          .includes(q);

      const activeMatch = activeFilter === 'all' || (activeFilter === 'active' ? row.isActive : !row.isActive);
      return searchMatch && activeMatch;
    });
  }, [activeFilter, config.rows, searchTerm]);

  const sortedRows = useMemo(() => {
    if (!sortBy || !sortDirection) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const left = formatCell(a.values[sortBy]);
      const right = formatCell(b.values[sortBy]);
      const result = compareValues(left, right);
      return sortDirection === 'asc' ? result : -result;
    });
  }, [filteredRows, sortBy, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [pageSize, safePage, sortedRows]);

  function onSort(key: string) {
    if (sortBy !== key) {
      setSortBy(key);
      setSortDirection('asc');
      return;
    }
    const d = nextSort(sortDirection);
    setSortDirection(d);
    if (d === null) setSortBy(null);
  }

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-surface p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Gestione Anagrafiche</h1>
        <p className="mt-1 text-sm text-secondary">Tabelle per entità reali di dominio con filtri, ordinamento tri-stato e multipaging.</p>
      </div>

      <div className="grid gap-2 rounded-xl border border-slate-200 bg-surface p-3 shadow-sm sm:grid-cols-2 xl:grid-cols-3">
        {(Object.keys(ENTITY_CONFIG) as EntityType[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setEntityType(key);
              setSearchTerm('');
              setActiveFilter('all');
              setSortBy(null);
              setSortDirection(null);
              setCurrentPage(1);
            }}
            className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
              entityType === key ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:text-primary'
            }`}
          >
            <p className="font-medium">{ENTITY_CONFIG[key].label}</p>
            <p className="text-xs text-secondary">{ENTITY_CONFIG[key].rows.length} record</p>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-surface p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="flex min-w-56 flex-1 flex-col gap-1 text-xs font-medium text-slate-700">
            Ricerca
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cerca nei campi della tabella..."
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary"
            />
          </label>

          <label className="flex min-w-44 flex-col gap-1 text-xs font-medium text-slate-700">
            Stato attivazione
            <select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value as 'all' | 'active' | 'inactive');
                setCurrentPage(1);
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary"
            >
              <option value="all">Tutti</option>
              <option value="active">Attivi</option>
              <option value="inactive">Disattivati</option>
            </select>
          </label>
        </div>

        <div className="mb-3 flex items-center justify-between text-xs text-secondary">
          <p>Entità: <span className="font-semibold text-slate-800">{config.label}</span></p>
          <p>Risultati: <span className="font-semibold text-slate-800">{sortedRows.length}</span></p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
            <thead className="bg-slate-50">
              <tr>
                {config.columns.map((column) => (
                  <th key={column.key} className={`${column.minWidth ?? ''} px-3 py-2 text-left font-semibold text-slate-700`}>
                    <button type="button" onClick={() => onSort(column.key)} className="inline-flex items-center gap-1 hover:text-primary">
                      <span>{column.label}</span>
                      <span>{sortBy !== column.key || !sortDirection ? '↕' : sortDirection === 'asc' ? '↑' : '↓'}</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={config.columns.length} className="px-3 py-10 text-center text-secondary">Nessun record trovato.</td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    {config.columns.map((column) => (
                      <td key={column.key} className="px-3 py-2 text-slate-700">
                        {formatCell(row.values[column.key])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span>Righe per pagina</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) as (typeof PAGE_SIZES)[number]);
                setCurrentPage(1);
              }}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            >
              {PAGE_SIZES.map((size) => (<option key={size} value={size}>{size}</option>))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setCurrentPage(1)} disabled={safePage === 1} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm disabled:opacity-50">« Prima</button>
            <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm disabled:opacity-50">‹ Prec</button>
            <span className="px-2 text-sm text-slate-700">Pagina {safePage} / {totalPages}</span>
            <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm disabled:opacity-50">Succ ›</button>
            <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm disabled:opacity-50">Ultima »</button>
          </div>
        </div>
      </div>
    </section>
  );
}
