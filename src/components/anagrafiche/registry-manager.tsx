'use client';

import { FormEvent, useMemo, useState } from 'react';

type RegistryKey =
  | 'linee'
  | 'prodotti-grezzi'
  | 'varieta'
  | 'imballaggi-secondari'
  | 'articoli'
  | 'sigle-lotto';

type RegistryRecord = {
  id: string;
  name: string;
  description: string;
  code: string;
  producer: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type SortDirection = 'none' | 'asc' | 'desc';

type SortState = {
  key: keyof RegistryRecord;
  direction: SortDirection;
};

type RegistryDefinition = {
  key: RegistryKey;
  label: string;
  description: string;
  searchPlaceholder: string;
};

const REGISTRY_DEFINITIONS: RegistryDefinition[] = [
  {
    key: 'linee',
    label: 'Linee',
    description: 'Gestione linee con ordinamento operativo e stato attivo/disattivo.',
    searchPlaceholder: 'Cerca linea per nome o descrizione...'
  },
  {
    key: 'prodotti-grezzi',
    label: 'Prodotti Grezzi',
    description: 'Anagrafica prodotto origine per associare varietà e articoli.',
    searchPlaceholder: 'Cerca prodotto grezzo per nome o categoria...'
  },
  {
    key: 'varieta',
    label: 'Varietà',
    description: 'Catalogo varietà legate ai prodotti grezzi e filiere.',
    searchPlaceholder: 'Cerca varietà, categoria o descrizione...'
  },
  {
    key: 'imballaggi-secondari',
    label: 'Imballaggi Secondari',
    description: 'Gestione imballaggi disponibili per confezionamento.',
    searchPlaceholder: 'Cerca imballaggio per codice o nome...'
  },
  {
    key: 'articoli',
    label: 'Articoli',
    description: 'Anagrafica articoli commerciali e criteri di confezionamento.',
    searchPlaceholder: 'Cerca articolo per codice, nome o produttore...'
  },
  {
    key: 'sigle-lotto',
    label: 'Sigle Lotto',
    description: 'Tabella sigle lotto abilitate per apertura lavorazioni.',
    searchPlaceholder: 'Cerca sigla lotto per codice, produttore o categoria...'
  }
];

const INITIAL_DATA: Record<RegistryKey, RegistryRecord[]> = {
  linee: [
    createRecord('Linea 01', 'Linea confezionamento premium', 'L01', 'Monito', 'Confezionamento'),
    createRecord('Linea 02', 'Linea calibratura automatica', 'L02', 'Monito', 'Calibratura'),
    createRecord('Linea 03', 'Linea mista agrumi', 'L03', 'Monito', 'Mista')
  ],
  'prodotti-grezzi': [
    createRecord('Uva da Tavola', 'Prodotto grezzo da filiera locale', 'PG01', 'Azienda Sole', 'Uva'),
    createRecord('Albicocche', 'Origine certificata', 'PG02', 'Cooperativa Sud', 'Drupacee'),
    createRecord('Mandarini', 'Conferimento giornaliero', 'PG03', 'Consorzio Nord', 'Agrumi')
  ],
  varieta: [
    createRecord('Italia', 'Varietà uva bianca', 'V01', 'Azienda Sole', 'Uva'),
    createRecord('Mogador', 'Varietà albicocca tardiva', 'V02', 'Cooperativa Sud', 'Drupacee'),
    createRecord('Nadorcott', 'Mandarino premium', 'V03', 'Consorzio Nord', 'Agrumi')
  ],
  'imballaggi-secondari': [
    createRecord('Cartone 40x60', 'Imballaggio standard export', 'IMB01', 'Pack SRL', 'Cartone'),
    createRecord('Bins', 'Contenitore grande capacità', 'IMB02', 'Pack SRL', 'Plastica'),
    createRecord('Cassa Legno', 'Imballaggio premium retail', 'IMB03', 'Wood Pack', 'Legno')
  ],
  articoli: [
    createRecord('Uva 500g', 'Confezione retail 500g', 'ART01', 'Azienda Sole', 'Retail'),
    createRecord('Albicocca 30x30', 'Vassoio standard', 'ART02', 'Cooperativa Sud', 'Standard'),
    createRecord('Mandarino 1kg', 'Confezione rete 1kg', 'ART03', 'Consorzio Nord', 'Retail')
  ],
  'sigle-lotto': [
    createRecord('Lotto 2026-001', 'Sigla lotto annuale', '2012', 'Azienda Sole', 'Uva Italia'),
    createRecord('Lotto 2026-002', 'Sigla lotto drupacee', '2205', 'Cooperativa Sud', 'Albicocca Mogador'),
    createRecord('Lotto 2026-003', 'Sigla lotto agrumi', '2311', 'Consorzio Nord', 'Mandarino Nadorcott')
  ]
};

const TABLE_COLUMNS: { key: keyof RegistryRecord; label: string; sortable: boolean }[] = [
  { key: 'code', label: 'Codice', sortable: true },
  { key: 'name', label: 'Nome', sortable: true },
  { key: 'producer', label: 'Produttore', sortable: true },
  { key: 'category', label: 'Categoria', sortable: true },
  { key: 'updatedAt', label: 'Ultimo aggiornamento', sortable: true },
  { key: 'isActive', label: 'Stato', sortable: true }
];

const PAGE_SIZE_OPTIONS = [5, 10, 20];

export function RegistryManager() {
  const [selectedRegistry, setSelectedRegistry] = useState<RegistryKey>('linee');
  const [recordsByRegistry, setRecordsByRegistry] = useState<Record<RegistryKey, RegistryRecord[]>>(INITIAL_DATA);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [producerFilter, setProducerFilter] = useState('all');
  const [sortState, setSortState] = useState<SortState>({ key: 'updatedAt', direction: 'none' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({ name: '', description: '', code: '', producer: '', category: '' });

  const activeDefinition = REGISTRY_DEFINITIONS.find((definition) => definition.key === selectedRegistry);
  const allRecords = recordsByRegistry[selectedRegistry];

  const availableCategories = useMemo(() => {
    const categories = new Set(allRecords.map((record) => record.category));
    return ['all', ...Array.from(categories).sort((a, b) => a.localeCompare(b, 'it'))];
  }, [allRecords]);

  const availableProducers = useMemo(() => {
    const producers = new Set(allRecords.map((record) => record.producer));
    return ['all', ...Array.from(producers).sort((a, b) => a.localeCompare(b, 'it'))];
  }, [allRecords]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('it');

    return allRecords.filter((record) => {
      const fullText = `${record.code} ${record.name} ${record.description} ${record.producer} ${record.category}`.toLocaleLowerCase('it');
      const matchesSearch = normalizedSearch.length === 0 || fullText.includes(normalizedSearch);
      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'active' ? record.isActive : !record.isActive);
      const matchesCategory = categoryFilter === 'all' || record.category === categoryFilter;
      const matchesProducer = producerFilter === 'all' || record.producer === producerFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesProducer;
    });
  }, [allRecords, categoryFilter, producerFilter, search, statusFilter]);

  const sortedRecords = useMemo(() => {
    if (sortState.direction === 'none') {
      return filteredRecords;
    }

    return [...filteredRecords].sort((first, second) => {
      const firstValue = first[sortState.key];
      const secondValue = second[sortState.key];

      const sortFactor = sortState.direction === 'asc' ? 1 : -1;

      if (typeof firstValue === 'boolean' && typeof secondValue === 'boolean') {
        return (Number(firstValue) - Number(secondValue)) * sortFactor;
      }

      return String(firstValue).localeCompare(String(secondValue), 'it') * sortFactor;
    });
  }, [filteredRecords, sortState]);

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const pagedRecords = sortedRecords.slice(startIndex, startIndex + pageSize);

  function handleRegistryChange(registryKey: RegistryKey) {
    setSelectedRegistry(registryKey);
    setSearch('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setProducerFilter('all');
    setSortState({ key: 'updatedAt', direction: 'none' });
    setCurrentPage(1);
    setEditingRecordId(null);
    setFormValues({ name: '', description: '', code: '', producer: '', category: '' });
  }

  function handleColumnSort(columnKey: keyof RegistryRecord) {
    setSortState((prevState) => {
      if (prevState.key !== columnKey) {
        return { key: columnKey, direction: 'asc' };
      }

      if (prevState.direction === 'asc') {
        return { key: columnKey, direction: 'desc' };
      }

      if (prevState.direction === 'desc') {
        return { key: columnKey, direction: 'none' };
      }

      return { key: columnKey, direction: 'asc' };
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formValues.name.trim() || !formValues.code.trim()) {
      return;
    }

    const nowIso = new Date().toISOString();

    setRecordsByRegistry((prevState) => {
      const registryRecords = prevState[selectedRegistry];

      if (editingRecordId) {
        const updatedRecords = registryRecords.map((record) => {
          if (record.id !== editingRecordId) {
            return record;
          }

          return {
            ...record,
            name: formValues.name.trim(),
            description: formValues.description.trim(),
            code: formValues.code.trim(),
            producer: formValues.producer.trim(),
            category: formValues.category.trim(),
            updatedAt: nowIso
          };
        });

        return { ...prevState, [selectedRegistry]: updatedRecords };
      }

      const newRecord: RegistryRecord = {
        id: crypto.randomUUID(),
        name: formValues.name.trim(),
        description: formValues.description.trim(),
        code: formValues.code.trim(),
        producer: formValues.producer.trim() || 'N/D',
        category: formValues.category.trim() || 'Generica',
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso,
        deletedAt: null
      };

      return {
        ...prevState,
        [selectedRegistry]: [newRecord, ...registryRecords]
      };
    });

    setEditingRecordId(null);
    setFormValues({ name: '', description: '', code: '', producer: '', category: '' });
    setCurrentPage(1);
  }

  function handleEdit(record: RegistryRecord) {
    setEditingRecordId(record.id);
    setFormValues({
      name: record.name,
      description: record.description,
      code: record.code,
      producer: record.producer,
      category: record.category
    });
  }

  function handleSoftDelete(recordId: string) {
    setRecordsByRegistry((prevState) => ({
      ...prevState,
      [selectedRegistry]: prevState[selectedRegistry].map((record) =>
        record.id === recordId
          ? { ...record, isActive: false, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : record
      )
    }));
  }

  function handleRestore(recordId: string) {
    setRecordsByRegistry((prevState) => ({
      ...prevState,
      [selectedRegistry]: prevState[selectedRegistry].map((record) =>
        record.id === recordId
          ? { ...record, isActive: true, deletedAt: null, updatedAt: new Date().toISOString() }
          : record
      )
    }));
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-xl border border-slate-200 bg-surface p-4 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold text-primary">Anagrafiche</h1>
        <nav className="space-y-2">
          {REGISTRY_DEFINITIONS.map((definition) => {
            const isSelected = definition.key === selectedRegistry;

            return (
              <button
                key={definition.key}
                type="button"
                onClick={() => handleRegistryChange(definition.key)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                  isSelected
                    ? 'border-primary bg-blue-50 text-primary'
                    : 'border-slate-200 text-secondary hover:border-primary hover:text-primary'
                }`}
              >
                {definition.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="space-y-4">
        <header className="rounded-xl border border-slate-200 bg-surface p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-primary">{activeDefinition?.label}</h2>
          <p className="mt-1 text-sm text-secondary">{activeDefinition?.description}</p>
        </header>

        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-surface p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium text-primary">
            {editingRecordId ? 'Modifica anagrafica selezionata' : 'Aggiungi una nuova anagrafica'}
          </p>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <input
              value={formValues.code}
              onChange={(event) => setFormValues((prev) => ({ ...prev, code: event.target.value }))}
              placeholder="Codice *"
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              value={formValues.name}
              onChange={(event) => setFormValues((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Nome *"
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              value={formValues.producer}
              onChange={(event) => setFormValues((prev) => ({ ...prev, producer: event.target.value }))}
              placeholder="Produttore"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              value={formValues.category}
              onChange={(event) => setFormValues((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="Categoria"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              value={formValues.description}
              onChange={(event) => setFormValues((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Descrizione"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary md:col-span-2 xl:col-span-1"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              {editingRecordId ? 'Salva modifiche' : 'Aggiungi'}
            </button>
            {editingRecordId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingRecordId(null);
                  setFormValues({ name: '', description: '', code: '', producer: '', category: '' });
                }}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm text-secondary hover:border-primary hover:text-primary"
              >
                Annulla
              </button>
            ) : null}
          </div>
        </form>

        <section className="rounded-xl border border-slate-200 bg-surface p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder={activeDefinition?.searchPlaceholder}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary xl:col-span-2"
            />

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as 'all' | 'active' | 'inactive');
                setCurrentPage(1);
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="all">Stato: tutti</option>
              <option value="active">Solo attivi</option>
              <option value="inactive">Solo disattivati</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'Categoria: tutte' : category}
                </option>
              ))}
            </select>

            <select
              value={producerFilter}
              onChange={(event) => {
                setProducerFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {availableProducers.map((producer) => (
                <option key={producer} value={producer}>
                  {producer === 'all' ? 'Produttore: tutti' : producer}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-secondary">
                <tr>
                  {TABLE_COLUMNS.map((column) => (
                    <th key={column.key} className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => column.sortable && handleColumnSort(column.key)}
                        className="inline-flex items-center gap-2 text-left hover:text-primary"
                      >
                        {column.label}
                        {sortState.key === column.key ? <span>{sortIcon(sortState.direction)}</span> : <span>↕</span>}
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {pagedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={TABLE_COLUMNS.length + 1} className="px-4 py-6 text-center text-secondary">
                      Nessun risultato con i filtri correnti.
                    </td>
                  </tr>
                ) : (
                  pagedRecords.map((record) => (
                    <tr key={record.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-primary">{record.code}</td>
                      <td className="px-4 py-3">{record.name}</td>
                      <td className="px-4 py-3">{record.producer}</td>
                      <td className="px-4 py-3">{record.category}</td>
                      <td className="px-4 py-3">{formatDateTime(record.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            record.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {record.isActive ? 'Attivo' : 'Disattivato'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(record)}
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-secondary hover:border-primary hover:text-primary"
                          >
                            Modifica
                          </button>
                          {record.isActive ? (
                            <button
                              type="button"
                              onClick={() => handleSoftDelete(record.id)}
                              className="rounded-md border border-red-200 px-2 py-1 text-xs text-error hover:bg-red-50"
                            >
                              Disattiva
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRestore(record.id)}
                              className="rounded-md border border-emerald-200 px-2 py-1 text-xs text-success hover:bg-emerald-50"
                            >
                              Riattiva
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 text-sm text-secondary">
            <div>
              Risultati: <strong>{sortedRecords.length}</strong> · Pagina <strong>{safeCurrentPage}</strong> di{' '}
              <strong>{totalPages}</strong>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="page-size">Righe:</label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-md border border-slate-300 px-2 py-1"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                className="rounded-md border border-slate-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                «
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                className="rounded-md border border-slate-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ‹
              </button>
              {buildVisiblePages(safeCurrentPage, totalPages).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-md border px-2 py-1 ${
                    page === safeCurrentPage ? 'border-primary bg-blue-50 text-primary' : 'border-slate-300'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                className="rounded-md border border-slate-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ›
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                className="rounded-md border border-slate-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                »
              </button>
            </div>
          </footer>
        </section>
      </div>
    </section>
  );
}

function buildVisiblePages(currentPage: number, totalPages: number): number[] {
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  const pages: number[] = [];

  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(page);
  }

  return pages;
}

function createRecord(
  name: string,
  description: string,
  code: string,
  producer: string,
  category: string
): RegistryRecord {
  const nowIso = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    name,
    description,
    code,
    producer,
    category,
    isActive: true,
    createdAt: nowIso,
    updatedAt: nowIso,
    deletedAt: null
  };
}

function sortIcon(direction: SortDirection): string {
  if (direction === 'asc') {
    return '↑';
  }

  if (direction === 'desc') {
    return '↓';
  }

  return '↕';
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}
