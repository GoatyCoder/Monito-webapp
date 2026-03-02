'use client';

import { useMemo, useState } from 'react';

type SortDirection = 'asc' | 'desc' | null;
type EntityType = 'linee' | 'prodotti' | 'varieta' | 'imballaggi' | 'articoli' | 'sigleLotto';

type RegistryRow = {
  id: string;
  nome: string;
  descrizione: string;
  stato: 'Attiva' | 'Disattivata';
  createdBy: string;
  updatedAt: string;
  dominio: string;
  tag: string;
};

type TableColumn = {
  key: keyof RegistryRow;
  label: string;
  widthClass?: string;
  align?: 'left' | 'right';
};

const ENTITY_LABELS: Record<EntityType, string> = {
  linee: 'Linee',
  prodotti: 'Prodotti Grezzi',
  varieta: 'Varietà',
  imballaggi: 'Imballaggi Secondari',
  articoli: 'Articoli',
  sigleLotto: 'Sigle Lotto'
};

const TABLE_COLUMNS: TableColumn[] = [
  { key: 'nome', label: 'Nome', widthClass: 'min-w-52' },
  { key: 'dominio', label: 'Dominio', widthClass: 'min-w-40' },
  { key: 'tag', label: 'Tag', widthClass: 'min-w-40' },
  { key: 'stato', label: 'Stato', widthClass: 'min-w-32' },
  { key: 'createdBy', label: 'Creato da', widthClass: 'min-w-40' },
  { key: 'updatedAt', label: 'Ultimo aggiornamento', widthClass: 'min-w-44' },
  { key: 'descrizione', label: 'Descrizione', widthClass: 'min-w-80' }
];

const DATASET: Record<EntityType, RegistryRow[]> = {
  linee: [
    { id: 'l1', nome: 'Linea 1', descrizione: 'Confezionamento uva bianca premium', stato: 'Attiva', createdBy: 'Admin', updatedAt: '2026-02-28', dominio: 'Produzione', tag: 'Ordine 1' },
    { id: 'l2', nome: 'Linea 2', descrizione: 'Confezionamento albicocche export', stato: 'Attiva', createdBy: 'Admin', updatedAt: '2026-02-26', dominio: 'Produzione', tag: 'Ordine 2' },
    { id: 'l3', nome: 'Linea 3', descrizione: 'Linea riserva per picchi stagionali', stato: 'Disattivata', createdBy: 'Admin', updatedAt: '2026-02-22', dominio: 'Produzione', tag: 'Ordine 3' },
    { id: 'l4', nome: 'Linea 4', descrizione: 'Confezioni mix agrumi retail', stato: 'Attiva', createdBy: 'Admin', updatedAt: '2026-02-20', dominio: 'Produzione', tag: 'Ordine 4' },
    { id: 'l5', nome: 'Linea 5', descrizione: 'Precalibrazione veloce', stato: 'Disattivata', createdBy: 'Admin', updatedAt: '2026-02-18', dominio: 'Produzione', tag: 'Ordine 5' }
  ],
  prodotti: [
    { id: 'p1', nome: 'Uva da Tavola', descrizione: 'Materia prima principale area Nord', stato: 'Attiva', createdBy: 'Admin', updatedAt: '2026-02-28', dominio: 'Anagrafica Materie Prime', tag: 'Frutta Fresca' },
    { id: 'p2', nome: 'Albicocca', descrizione: 'Calibro medio per confezioni 500g', stato: 'Attiva', createdBy: 'Admin', updatedAt: '2026-02-27', dominio: 'Anagrafica Materie Prime', tag: 'Drupacee' },
    { id: 'p3', nome: 'Mandarino', descrizione: 'Prodotto per linea invernale', stato: 'Attiva', createdBy: 'Admin', updatedAt: '2026-02-24', dominio: 'Anagrafica Materie Prime', tag: 'Agrumi' },
    { id: 'p4', nome: 'Melograno', descrizione: 'Produzione spot su richiesta clienti', stato: 'Disattivata', createdBy: 'Admin', updatedAt: '2026-02-19', dominio: 'Anagrafica Materie Prime', tag: 'Speciali' },
    { id: 'p5', nome: 'Fico d’India', descrizione: 'Pilot sperimentale 2025', stato: 'Disattivata', createdBy: 'Admin', updatedAt: '2026-02-14', dominio: 'Anagrafica Materie Prime', tag: 'Speciali' }
  ],
  varieta: [
    { id: 'v1', nome: 'Italia', descrizione: 'Varietà per export premium', stato: 'Attiva', createdBy: 'Admin', updatedAt: '2026-02-28', dominio: 'Uva da Tavola', tag: 'Bianca' },
    { id: 'v2', nome: 'Red Globe', descrizione: 'Varietà rossa con grappolo grande', stato: 'Attiva', createdBy: 'Admin', updatedAt: '2026-02-27', dominio: 'Uva da Tavola', tag: 'Rossa' },
    { id: 'v3', nome: 'Mikado', descrizione: 'Albicocca precoce', stato: 'Attiva', createdBy: 'Admin', updatedAt: '2026-02-25', dominio: 'Albicocca', tag: 'Precoce' },
    { id: 'v4', nome: 'Tardivo di Ciaculli', descrizione: 'Mandarino tardivo per confezioni winter', stato: 'Attiva', createdBy: 'Admin', updatedAt: '2026-02-23', dominio: 'Mandarino', tag: 'Tardivo' },
    { id: 'v5', nome: 'Fantasy', descrizione: 'Varietà test non più in uso', stato: 'Disattivata', createdBy: 'Admin', updatedAt: '2026-02-16', dominio: 'Uva da Tavola', tag: 'Storico' }
  ],
  imballaggi: [
    { id: 'i1', nome: 'Cartone 40x60', descrizione: 'Formato standard pedana Euro', stato: 'Attiva', createdBy: 'Admin', updatedAt: '2026-02-28', dominio: 'Packaging', tag: '40x60' },
    { id: 'i2', nome: 'Cartone 30x40', descrizione: 'Formato per retail piccolo', stato: 'Attiva', createdBy: 'Admin', updatedAt: '2026-02-26', dominio: 'Packaging', tag: '30x40' },
    { id: 'i3', nome: 'Bins Plastica', descrizione: 'Imballo grande per lavorazioni bulk', stato: 'Attiva', createdBy: 'Admin', updatedAt: '2026-02-24', dominio: 'Packaging', tag: 'Bulk' },
    { id: 'i4', nome: 'Cassa Legno', descrizione: 'Prodotti premium stagionali', stato: 'Disattivata', createdBy: 'Admin', updatedAt: '2026-02-19', dominio: 'Packaging', tag: 'Premium' },
    { id: 'i5', nome: 'Vassoio PET', descrizione: 'Formato retail trasparente', stato: 'Attiva', createdBy: 'Admin', updatedAt: '2026-02-17', dominio: 'Packaging', tag: 'Retail' }
  ],
  articoli: [
    { id: 'a1', nome: 'Uva Bianca 500g', descrizione: 'Peso fisso per confezione GDO', stato: 'Attiva', createdBy: 'Admin', updatedAt: '2026-02-28', dominio: 'Uva da Tavola', tag: 'Peso fisso' },
    { id: 'a2', nome: 'Uva Italia 1kg', descrizione: 'Confezione premium export', stato: 'Attiva', createdBy: 'Admin', updatedAt: '2026-02-27', dominio: 'Uva da Tavola', tag: 'Peso fisso' },
    { id: 'a3', nome: 'Albicocca 750g', descrizione: 'Confezione stagionale variabile', stato: 'Attiva', createdBy: 'Admin', updatedAt: '2026-02-25', dominio: 'Albicocca', tag: 'Peso variabile' },
    { id: 'a4', nome: 'Mandarino 2kg', descrizione: 'Pacco famiglia invernale', stato: 'Attiva', createdBy: 'Admin', updatedAt: '2026-02-23', dominio: 'Mandarino', tag: 'Peso fisso' },
    { id: 'a5', nome: 'Uva Mix 1.2kg', descrizione: 'Articolo pilota fermato', stato: 'Disattivata', createdBy: 'Admin', updatedAt: '2026-02-14', dominio: 'Uva da Tavola', tag: 'Storico' }
  ],
  sigleLotto: [
    { id: 's1', nome: '2012', descrizione: 'Produttore Rossi - Campo A', stato: 'Attiva', createdBy: 'Admin', updatedAt: '2026-02-28', dominio: 'Uva da Tavola / Italia', tag: 'Rossi' },
    { id: 's2', nome: '2088', descrizione: 'Produttore Bianchi - Campo C', stato: 'Attiva', createdBy: 'Admin', updatedAt: '2026-02-27', dominio: 'Albicocca / Mikado', tag: 'Bianchi' },
    { id: 's3', nome: '1980', descrizione: 'Produttore Verde - Campo G', stato: 'Attiva', createdBy: 'Admin', updatedAt: '2026-02-24', dominio: 'Mandarino / Tardivo', tag: 'Verde' },
    { id: 's4', nome: '1740', descrizione: 'Produttore Neri - Campo B', stato: 'Disattivata', createdBy: 'Admin', updatedAt: '2026-02-18', dominio: 'Uva da Tavola / Red Globe', tag: 'Neri' },
    { id: 's5', nome: '1652', descrizione: 'Produttore Test - Campo Z', stato: 'Disattivata', createdBy: 'Admin', updatedAt: '2026-02-12', dominio: 'Speciali / Test', tag: 'Test' }
  ]
};

const PAGE_SIZES = [5, 10, 20] as const;

function cycleSortDirection(current: SortDirection): SortDirection {
  if (current === null) {
    return 'asc';
  }

  if (current === 'asc') {
    return 'desc';
  }

  return null;
}

function compareValues(a: string, b: string): number {
  return a.localeCompare(b, 'it', { sensitivity: 'base' });
}

export function AnagraficheManager() {
  const [entityType, setEntityType] = useState<EntityType>('linee');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RegistryRow['stato']>('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [createdByFilter, setCreatedByFilter] = useState<'all' | string>('all');
  const [sortBy, setSortBy] = useState<keyof RegistryRow | null>('nome');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);

  const rows = DATASET[entityType];

  const domainOptions = useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.dominio))).sort((a, b) => compareValues(a, b));
  }, [rows]);

  const createdByOptions = useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.createdBy))).sort((a, b) => compareValues(a, b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const loweredSearch = searchTerm.trim().toLowerCase();

    return rows.filter((row) => {
      const searchMatch =
        loweredSearch.length === 0 ||
        row.nome.toLowerCase().includes(loweredSearch) ||
        row.descrizione.toLowerCase().includes(loweredSearch) ||
        row.dominio.toLowerCase().includes(loweredSearch) ||
        row.tag.toLowerCase().includes(loweredSearch);

      const statusMatch = statusFilter === 'all' || row.stato === statusFilter;
      const domainMatch = domainFilter === 'all' || row.dominio === domainFilter;
      const createdByMatch = createdByFilter === 'all' || row.createdBy === createdByFilter;

      return searchMatch && statusMatch && domainMatch && createdByMatch;
    });
  }, [rows, searchTerm, statusFilter, domainFilter, createdByFilter]);

  const sortedRows = useMemo(() => {
    if (!sortBy || !sortDirection) {
      return filteredRows;
    }

    return [...filteredRows].sort((a, b) => {
      const result = compareValues(String(a[sortBy]), String(b[sortBy]));
      return sortDirection === 'asc' ? result : -result;
    });
  }, [filteredRows, sortBy, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [safeCurrentPage, pageSize, sortedRows]);

  const visiblePageNumbers = useMemo(() => {
    const pages: number[] = [];
    const radius = 2;
    const min = Math.max(1, safeCurrentPage - radius);
    const max = Math.min(totalPages, safeCurrentPage + radius);

    for (let page = min; page <= max; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [safeCurrentPage, totalPages]);

  function handleChangeEntity(next: EntityType) {
    setEntityType(next);
    setCurrentPage(1);
    setSortBy('nome');
    setSortDirection('asc');
    setSearchTerm('');
    setStatusFilter('all');
    setDomainFilter('all');
    setCreatedByFilter('all');
  }

  function handleHeaderSort(columnKey: keyof RegistryRow) {
    if (sortBy !== columnKey) {
      setSortBy(columnKey);
      setSortDirection('asc');
      return;
    }

    const nextDirection = cycleSortDirection(sortDirection);
    setSortDirection(nextDirection);
    if (nextDirection === null) {
      setSortBy(null);
    }
  }

  function getSortSymbol(columnKey: keyof RegistryRow) {
    if (sortBy !== columnKey || !sortDirection) {
      return '↕';
    }

    return sortDirection === 'asc' ? '↑' : '↓';
  }

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-surface p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Gestione Anagrafiche</h1>
        <p className="mt-1 text-sm text-secondary">
          Interfaccia amministrativa ispirata al dominio Monito: anagrafiche con soft-delete, tracciabilità e consultazione rapida.
        </p>
      </div>

      <div className="grid gap-2 rounded-xl border border-slate-200 bg-surface p-3 shadow-sm sm:grid-cols-2 xl:grid-cols-3">
        {(Object.keys(ENTITY_LABELS) as EntityType[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleChangeEntity(key)}
            className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
              entityType === key
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:text-primary'
            }`}
          >
            <p className="font-medium">{ENTITY_LABELS[key]}</p>
            <p className="text-xs text-secondary">{DATASET[key].length} record</p>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-surface p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="flex min-w-56 flex-1 flex-col gap-1 text-xs font-medium text-slate-700">
            Ricerca intelligente
            <input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Nome, descrizione, dominio, tag..."
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary"
            />
          </label>

          <label className="flex min-w-40 flex-col gap-1 text-xs font-medium text-slate-700">
            Stato
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as 'all' | RegistryRow['stato']);
                setCurrentPage(1);
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary"
            >
              <option value="all">Tutti</option>
              <option value="Attiva">Attive</option>
              <option value="Disattivata">Disattivate</option>
            </select>
          </label>

          <label className="flex min-w-52 flex-col gap-1 text-xs font-medium text-slate-700">
            Dominio
            <select
              value={domainFilter}
              onChange={(event) => {
                setDomainFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary"
            >
              <option value="all">Tutti i domini</option>
              {domainOptions.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </label>

          <label className="flex min-w-40 flex-col gap-1 text-xs font-medium text-slate-700">
            Creato da
            <select
              value={createdByFilter}
              onChange={(event) => {
                setCreatedByFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary"
            >
              <option value="all">Tutti</option>
              {createdByOptions.map((author) => (
                <option key={author} value={author}>
                  {author}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setDomainFilter('all');
              setCreatedByFilter('all');
              setCurrentPage(1);
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:border-primary hover:text-primary"
          >
            Reset filtri
          </button>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-secondary">
          <p>
            Entità selezionata: <span className="font-semibold text-slate-800">{ENTITY_LABELS[entityType]}</span>
          </p>
          <p>
            Risultati: <span className="font-semibold text-slate-800">{sortedRows.length}</span>
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 bg-white text-sm">
            <thead className="bg-slate-50">
              <tr>
                {TABLE_COLUMNS.map((column) => (
                  <th key={column.key} className={`${column.widthClass ?? ''} px-3 py-2 text-left font-semibold text-slate-700`}>
                    <button
                      type="button"
                      onClick={() => handleHeaderSort(column.key)}
                      className="inline-flex items-center gap-1 hover:text-primary"
                    >
                      <span>{column.label}</span>
                      <span aria-hidden>{getSortSymbol(column.key)}</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-900">{row.nome}</td>
                    <td className="px-3 py-2 text-slate-700">{row.dominio}</td>
                    <td className="px-3 py-2 text-slate-700">{row.tag}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          row.stato === 'Attiva' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {row.stato}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{row.createdBy}</td>
                    <td className="px-3 py-2 text-slate-700">{row.updatedAt}</td>
                    <td className="px-3 py-2 text-slate-700">{row.descrizione}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={TABLE_COLUMNS.length} className="px-3 py-10 text-center text-sm text-secondary">
                    Nessun record trovato con i filtri selezionati.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span>Righe per pagina</span>
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value) as (typeof PAGE_SIZES)[number]);
                setCurrentPage(1);
              }}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              « Prima
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
              disabled={safeCurrentPage === 1}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              ‹ Prec
            </button>

            {visiblePageNumbers.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`rounded-md px-3 py-1 text-sm ${
                  page === safeCurrentPage ? 'bg-primary text-white' : 'border border-slate-300 bg-white text-slate-700'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
              disabled={safeCurrentPage === totalPages}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Succ ›
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ultima »
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
