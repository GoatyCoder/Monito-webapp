'use client';

import { FormEvent, useMemo, useState } from 'react';

type ColumnType = 'text' | 'number' | 'boolean' | 'date';

type RegistryRecord = {
  id: string;
  [key: string]: string | number | boolean;
};

type RegistryColumn = {
  key: string;
  label: string;
  type: ColumnType;
  required?: boolean;
};

type RegistryConfig = {
  key: RegistryKey;
  label: string;
  singularLabel: string;
  description: string;
  columns: RegistryColumn[];
  initialData: RegistryRecord[];
};

type RegistryKey =
  | 'linee'
  | 'prodotti'
  | 'varieta'
  | 'imballaggi'
  | 'articoli'
  | 'sigleLotto'
  | 'lottiIngresso';

const registryConfigs: RegistryConfig[] = [
  {
    key: 'linee',
    label: 'Linee',
    singularLabel: 'linea',
    description: 'Gestione linee produttive con ordinamento cruscotto.',
    columns: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'descrizione', label: 'Descrizione', type: 'text' },
      { key: 'ordine', label: 'Ordine', type: 'number' }
    ],
    initialData: [
      { id: 'l1', nome: 'Linea 1', descrizione: 'Confezionamento Nord', ordine: 1 },
      { id: 'l2', nome: 'Linea 2', descrizione: 'Confezionamento Sud', ordine: 2 },
      { id: 'l3', nome: 'Linea 4', descrizione: 'Calibratura export', ordine: 4 }
    ]
  },
  {
    key: 'prodotti',
    label: 'Prodotti grezzi',
    singularLabel: 'prodotto grezzo',
    description: 'Catalogo prodotti grezzi: nome e descrizione.',
    columns: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'descrizione', label: 'Descrizione', type: 'text' }
    ],
    initialData: [
      { id: 'p1', nome: 'Uva da Tavola', descrizione: 'Prodotto per confezionamento retail' },
      { id: 'p2', nome: 'Agrumi', descrizione: 'Arance e mandarini da lavorare' },
      { id: 'p3', nome: 'Melograno', descrizione: 'Lavorazione stagionale' }
    ]
  },
  {
    key: 'varieta',
    label: 'Varietà',
    singularLabel: 'varietà',
    description: 'Cultivar collegate al prodotto grezzo di riferimento.',
    columns: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'descrizione', label: 'Descrizione', type: 'text' },
      { key: 'prodottoGrezzo', label: 'Prodotto grezzo', type: 'text', required: true }
    ],
    initialData: [
      { id: 'v1', nome: 'Crimson', descrizione: 'Uva rossa senza semi', prodottoGrezzo: 'Uva da Tavola' },
      { id: 'v2', nome: 'Italia', descrizione: 'Uva bianca da tavola', prodottoGrezzo: 'Uva da Tavola' },
      { id: 'v3', nome: 'Navelina', descrizione: 'Arancia da spremuta', prodottoGrezzo: 'Agrumi' }
    ]
  },
  {
    key: 'imballaggi',
    label: 'Imballaggi secondari',
    singularLabel: 'imballaggio',
    description: 'Imballaggi con tara e misure principali.',
    columns: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'descrizione', label: 'Descrizione', type: 'text' },
      { key: 'taraKg', label: 'Tara (kg)', type: 'number' },
      { key: 'dimensioniCm', label: 'Dimensioni (cm)', type: 'text' }
    ],
    initialData: [
      { id: 'i1', nome: 'Cartone 40x60', descrizione: 'Standard linea confezionamento', taraKg: 0.35, dimensioniCm: '40x60x30' },
      { id: 'i2', nome: 'Vassoio flow-pack', descrizione: 'Formato retail', taraKg: 0.12, dimensioniCm: '30x40x8' },
      { id: 'i3', nome: 'Cassetta legno', descrizione: 'Premium', taraKg: 0.8, dimensioniCm: '45x65x32' }
    ]
  },
  {
    key: 'articoli',
    label: 'Articoli',
    singularLabel: 'articolo',
    description: 'Prodotti finiti con peso per collo e vincoli lotto.',
    columns: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'descrizione', label: 'Descrizione', type: 'text' },
      { key: 'pesoPerCollo', label: 'Peso per collo (kg)', type: 'number', required: true },
      { key: 'pesoVariabile', label: 'Peso variabile', type: 'boolean' },
      { key: 'vincoloProdotto', label: 'Vincolo prodotto grezzo', type: 'text' },
      { key: 'vincoloVarieta', label: 'Vincolo varietà', type: 'text' }
    ],
    initialData: [
      {
        id: 'a1',
        nome: 'Uva Bianca 500g',
        descrizione: 'Confezione retail',
        pesoPerCollo: 0.5,
        pesoVariabile: false,
        vincoloProdotto: 'Uva da Tavola',
        vincoloVarieta: 'Italia'
      },
      {
        id: 'a2',
        nome: 'Uva Rossa 1kg',
        descrizione: 'Confezione premium',
        pesoPerCollo: 1,
        pesoVariabile: false,
        vincoloProdotto: 'Uva da Tavola',
        vincoloVarieta: 'Crimson'
      },
      {
        id: 'a3',
        nome: 'Mix agrumi 2kg',
        descrizione: 'Misto stagionale',
        pesoPerCollo: 2,
        pesoVariabile: true,
        vincoloProdotto: 'Agrumi',
        vincoloVarieta: ''
      }
    ]
  },
  {
    key: 'sigleLotto',
    label: 'Sigle lotto',
    singularLabel: 'sigla lotto',
    description: 'Partite configurate per produttore, prodotto e varietà.',
    columns: [
      { key: 'codice', label: 'Codice', type: 'text', required: true },
      { key: 'produttore', label: 'Produttore', type: 'text', required: true },
      { key: 'prodottoGrezzo', label: 'Prodotto grezzo', type: 'text', required: true },
      { key: 'varieta', label: 'Varietà', type: 'text', required: true },
      { key: 'campo', label: 'Campo', type: 'text' }
    ],
    initialData: [
      { id: 's1', codice: '2012', produttore: 'Azienda Verde', prodottoGrezzo: 'Uva da Tavola', varieta: 'Italia', campo: 'A' },
      { id: 's2', codice: '2099', produttore: 'Fratelli Sole', prodottoGrezzo: 'Uva da Tavola', varieta: 'Crimson', campo: 'C' }
    ]
  },
  {
    key: 'lottiIngresso',
    label: 'Lotti ingresso',
    singularLabel: 'lotto ingresso',
    description: 'Conferimenti fisici generati da sigla e DOY.',
    columns: [
      { key: 'codice', label: 'Codice', type: 'text', required: true },
      { key: 'siglaLotto', label: 'Sigla lotto', type: 'text', required: true },
      { key: 'dataIngresso', label: 'Data ingresso', type: 'date', required: true },
      { key: 'doy', label: 'DOY', type: 'number', required: true }
    ],
    initialData: [
      { id: 'li1', codice: '2012-041', siglaLotto: '2012', dataIngresso: '2026-02-10', doy: 41 },
      { id: 'li2', codice: '2012-042', siglaLotto: '2012', dataIngresso: '2026-02-11', doy: 42 },
      { id: 'li3', codice: '2099-053', siglaLotto: '2099', dataIngresso: '2026-02-22', doy: 53 }
    ]
  }
];

const pageSizeOptions = [5, 10, 20];

type ModalMode = 'create' | 'edit';

export default function AnagrafichePage() {
  const [activeTab, setActiveTab] = useState<RegistryKey>('linee');
  const [recordsMap, setRecordsMap] = useState<Record<RegistryKey, RegistryRecord[]>>(() =>
    registryConfigs.reduce(
      (acc, config) => ({ ...acc, [config.key]: config.initialData }),
      {} as Record<RegistryKey, RegistryRecord[]>
    )
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const config = registryConfigs.find((item) => item.key === activeTab) ?? registryConfigs[0];
  const rows = useMemo(() => recordsMap[config.key] ?? [], [config.key, recordsMap]);

  const sortedAndFilteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filteredRows = rows.filter((row) => {
      const values = config.columns.map((column) => String(row[column.key] ?? '').toLowerCase());
      const isSearchMatch = normalizedSearch ? values.some((value) => value.includes(normalizedSearch)) : true;

      const isColumnMatch = config.columns.every((column) => {
        const filterValue = columnFilters[column.key]?.trim().toLowerCase();
        if (!filterValue) {
          return true;
        }

        const rowValue = String(row[column.key] ?? '').toLowerCase();
        return rowValue.includes(filterValue);
      });

      return isSearchMatch && isColumnMatch;
    });

    if (!sortBy) {
      return filteredRows;
    }

    return [...filteredRows].sort((leftRow, rightRow) => {
      const leftValue = leftRow[sortBy];
      const rightValue = rightRow[sortBy];

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return sortDirection === 'asc' ? leftValue - rightValue : rightValue - leftValue;
      }

      if (typeof leftValue === 'boolean' && typeof rightValue === 'boolean') {
        return sortDirection === 'asc' ? Number(leftValue) - Number(rightValue) : Number(rightValue) - Number(leftValue);
      }

      const comparison = String(leftValue ?? '').localeCompare(String(rightValue ?? ''), 'it', { numeric: true });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [columnFilters, config.columns, rows, search, sortBy, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedAndFilteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pagedRows = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return sortedAndFilteredRows.slice(startIndex, startIndex + pageSize);
  }, [pageSize, safePage, sortedAndFilteredRows]);

  const visiblePageNumbers = useMemo(() => {
    const windowSize = 5;
    const start = Math.max(1, safePage - Math.floor(windowSize / 2));
    const end = Math.min(totalPages, start + windowSize - 1);
    const adjustedStart = Math.max(1, end - windowSize + 1);

    return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index);
  }, [safePage, totalPages]);

  const resetViewState = () => {
    setSearch('');
    setColumnFilters({});
    setSortBy('');
    setSortDirection('asc');
    setPage(1);
  };

  const prepareEmptyForm = () => {
    const entries = config.columns.map((column) => [column.key, column.type === 'boolean' ? 'false' : '']);
    setFormData(Object.fromEntries(entries));
  };

  const openCreateModal = () => {
    prepareEmptyForm();
    setModalMode('create');
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (row: RegistryRecord) => {
    const nextFormData = Object.fromEntries(config.columns.map((column) => [column.key, String(row[column.key] ?? '')]));
    setFormData(nextFormData);
    setModalMode('edit');
    setEditingId(row.id);
    setModalOpen(true);
  };

  const upsertRecord = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const missingRequired = config.columns.find((column) => column.required && !formData[column.key]?.trim());
    if (missingRequired) {
      return;
    }

    const recordPayload = Object.fromEntries(
      config.columns.map((column) => {
        const rawValue = formData[column.key] ?? '';

        if (column.type === 'number') {
          return [column.key, rawValue === '' ? 0 : Number(rawValue)];
        }

        if (column.type === 'boolean') {
          return [column.key, rawValue === 'true'];
        }

        return [column.key, rawValue];
      })
    );

    setRecordsMap((currentMap) => {
      const currentRows = currentMap[config.key] ?? [];

      if (modalMode === 'edit' && editingId) {
        return {
          ...currentMap,
          [config.key]: currentRows.map((row) => (row.id === editingId ? { ...row, ...recordPayload } : row))
        };
      }

      return {
        ...currentMap,
        [config.key]: [{ id: crypto.randomUUID(), ...recordPayload }, ...currentRows]
      };
    });

    setModalOpen(false);
  };

  const deleteRecord = (recordId: string) => {
    const confirmation = window.confirm(`Confermi eliminazione di questa ${config.singularLabel}?`);
    if (!confirmation) {
      return;
    }

    setRecordsMap((currentMap) => ({
      ...currentMap,
      [config.key]: (currentMap[config.key] ?? []).filter((row) => row.id !== recordId)
    }));
  };

  const handleHeaderSort = (columnKey: string) => {
    setPage(1);
    if (sortBy !== columnKey) {
      setSortBy(columnKey);
      setSortDirection('asc');
      return;
    }

    setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <section className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Anagrafiche</h1>
        <p className="mt-2 text-sm text-secondary">Interfaccia amministrativa con CRUD, filtri collassabili, ordinamento su intestazioni e paginazione migliorata.</p>
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
                  resetViewState();
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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{config.label}</h2>
            <p className="text-sm text-secondary">{config.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsFilterOpen((current) => !current)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-secondary transition hover:bg-slate-100"
            >
              {isFilterOpen ? 'Chiudi filtri' : 'Apri filtri'}
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-md border border-primary bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              + Aggiungi {config.singularLabel}
            </button>
          </div>
        </div>

        {isFilterOpen ? (
          <div className="space-y-3 rounded-lg bg-background p-4">
            <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-secondary">
              Ricerca globale
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder={`Cerca in ${config.label.toLowerCase()}...`}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 outline-none ring-primary transition focus:ring-2"
              />
            </label>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {config.columns.map((column) => (
                <label key={column.key} className="flex flex-col gap-1 text-xs font-medium uppercase tracking-wide text-secondary">
                  Filtro {column.label}
                  <input
                    value={columnFilters[column.key] ?? ''}
                    onChange={(event) => {
                      setColumnFilters((current) => ({ ...current, [column.key]: event.target.value }));
                      setPage(1);
                    }}
                    placeholder={`Contiene ${column.label.toLowerCase()}`}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-800 outline-none ring-primary transition focus:ring-2"
                  />
                </label>
              ))}
            </div>

            <div>
              <button
                type="button"
                onClick={resetViewState}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-secondary transition hover:bg-slate-100"
              >
                Reset filtri e ordinamento
              </button>
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {config.columns.map((column) => {
                  const isSorted = sortBy === column.key;
                  const arrow = !isSorted ? '↕' : sortDirection === 'asc' ? '↑' : '↓';

                  return (
                    <th key={column.key} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-secondary">
                      <button
                        type="button"
                        onClick={() => handleHeaderSort(column.key)}
                        className="inline-flex items-center gap-1 hover:text-primary"
                        title={`Ordina per ${column.label}`}
                      >
                        <span>{column.label}</span>
                        <span>{arrow}</span>
                      </button>
                    </th>
                  );
                })}
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-secondary">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {pagedRows.length > 0 ? (
                pagedRows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-slate-50">
                    {config.columns.map((column) => (
                      <td key={column.key} className="whitespace-nowrap px-3 py-3 text-slate-700">
                        {column.type === 'boolean' ? ((row[column.key] as boolean) ? 'Sì' : 'No') : String(row[column.key] ?? '-')}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-secondary transition hover:bg-slate-100"
                        >
                          Modifica
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRecord(row.id)}
                          className="rounded-md border border-error px-3 py-1.5 text-xs font-medium text-error transition hover:bg-red-50"
                        >
                          Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={config.columns.length + 1} className="px-3 py-8 text-center text-secondary">
                    Nessun risultato trovato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-200 pt-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm text-secondary">
            <span>
              Mostrando {(safePage - 1) * pageSize + (pagedRows.length ? 1 : 0)}-{(safePage - 1) * pageSize + pagedRows.length} di {sortedAndFilteredRows.length}
            </span>
            <label className="inline-flex items-center gap-2">
              <span>Righe</span>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800"
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs text-secondary disabled:opacity-50"
            >
              «
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage === 1}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs text-secondary disabled:opacity-50"
            >
              ‹
            </button>

            {visiblePageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                className={`rounded-md border px-2.5 py-1 text-xs ${
                  pageNumber === safePage ? 'border-primary bg-primary text-white' : 'border-slate-300 text-secondary'
                }`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={safePage === totalPages}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs text-secondary disabled:opacity-50"
            >
              ›
            </button>
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs text-secondary disabled:opacity-50"
            >
              »
            </button>
          </div>
        </footer>
      </article>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              {modalMode === 'create' ? `Aggiungi ${config.singularLabel}` : `Modifica ${config.singularLabel}`}
            </h3>

            <form className="mt-4 space-y-4" onSubmit={upsertRecord}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {config.columns.map((column) => (
                  <label key={column.key} className="flex flex-col gap-1 text-sm text-secondary">
                    {column.label}
                    {column.type === 'boolean' ? (
                      <select
                        value={formData[column.key] ?? 'false'}
                        onChange={(event) => setFormData((current) => ({ ...current, [column.key]: event.target.value }))}
                        className="rounded-md border border-slate-300 px-3 py-2 text-slate-900"
                      >
                        <option value="false">No</option>
                        <option value="true">Sì</option>
                      </select>
                    ) : (
                      <input
                        type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
                        step={column.type === 'number' ? '0.01' : undefined}
                        required={Boolean(column.required)}
                        value={formData[column.key] ?? ''}
                        onChange={(event) => setFormData((current) => ({ ...current, [column.key]: event.target.value }))}
                        className="rounded-md border border-slate-300 px-3 py-2 text-slate-900"
                      />
                    )}
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm text-secondary"
                >
                  Annulla
                </button>
                <button type="submit" className="rounded-md border border-primary bg-primary px-4 py-2 text-sm text-white">
                  Salva
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
