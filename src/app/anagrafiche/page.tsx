'use client';

import { FormEvent, useMemo, useState } from 'react';

type EntityKey =
  | 'prodottiGrezzi'
  | 'varieta'
  | 'articoli'
  | 'imballaggiSecondari'
  | 'linee'
  | 'sigleLotto'
  | 'lottiIngresso';

type EntityRow = {
  id: string;
  nome: string;
  descrizione: string;
  stato: 'Attivo' | 'Inattivo';
  categoria?: string;
};

type SortKey = 'nome' | 'descrizione' | 'stato';
type SortDirection = 'asc' | 'desc';

const TABS: Array<{ key: EntityKey; label: string; singular: string }> = [
  { key: 'prodottiGrezzi', label: 'Prodotti Grezzi', singular: 'Prodotto' },
  { key: 'varieta', label: 'Varietà', singular: 'Varietà' },
  { key: 'articoli', label: 'Articoli', singular: 'Articolo' },
  { key: 'imballaggiSecondari', label: 'Imballaggi Secondari', singular: 'Imballaggio' },
  { key: 'linee', label: 'Linee', singular: 'Linea' },
  { key: 'sigleLotto', label: 'Sigle Lotto', singular: 'Sigla Lotto' },
  { key: 'lottiIngresso', label: 'Lotti Ingresso', singular: 'Lotto Ingresso' }
];

const INITIAL_DATA: Record<EntityKey, EntityRow[]> = {
  prodottiGrezzi: [
    { id: 'pg-001', nome: 'Uva da Tavola', descrizione: 'Uva da tavola di prima qualità', stato: 'Attivo', categoria: 'Frutta' },
    { id: 'pg-002', nome: 'Albicocche', descrizione: 'Albicocche fresche', stato: 'Attivo', categoria: 'Frutta' },
    { id: 'pg-003', nome: 'Mandarini', descrizione: 'Mandarini di stagione', stato: 'Attivo', categoria: 'Agrumi' },
    { id: 'pg-004', nome: 'Pesche', descrizione: 'Pesche gialle e bianche', stato: 'Inattivo', categoria: 'Frutta' },
    { id: 'pg-005', nome: 'Ciliegie', descrizione: 'Ciliegie Ferrovia e altre', stato: 'Attivo', categoria: 'Frutta' },
    { id: 'pg-006', nome: 'Arance', descrizione: 'Arance Tarocco e Navel', stato: 'Attivo', categoria: 'Agrumi' }
  ],
  varieta: [
    { id: 'var-001', nome: 'Crimson', descrizione: 'Varietà seedless premium', stato: 'Attivo', categoria: 'Uva da Tavola' },
    { id: 'var-002', nome: 'Italia', descrizione: 'Varietà con seme', stato: 'Attivo', categoria: 'Uva da Tavola' },
    { id: 'var-003', nome: 'Navelina', descrizione: 'Varietà precoce da mensa', stato: 'Attivo', categoria: 'Arance' }
  ],
  articoli: [
    { id: 'art-001', nome: 'Vaschetta 500g', descrizione: 'Peso fisso, retail GDO', stato: 'Attivo', categoria: 'Peso fisso' },
    { id: 'art-002', nome: 'Cassetta 7kg', descrizione: 'Peso variabile, mercato interno', stato: 'Attivo', categoria: 'Peso variabile' },
    { id: 'art-003', nome: 'Flowpack 1kg', descrizione: 'Confezione filmata', stato: 'Inattivo', categoria: 'Peso fisso' }
  ],
  imballaggiSecondari: [
    { id: 'imb-001', nome: 'Cartone 40x60', descrizione: 'Cartone ondulato doppia onda', stato: 'Attivo', categoria: 'Cartone' },
    { id: 'imb-002', nome: 'Bins', descrizione: 'Bins in plastica alimentare', stato: 'Attivo', categoria: 'Contenitore' }
  ],
  linee: [
    { id: 'lin-001', nome: 'Linea 1', descrizione: 'Confezionamento uva', stato: 'Attivo', categoria: 'Confezionamento' },
    { id: 'lin-002', nome: 'Linea 2', descrizione: 'Calibratura agrumi', stato: 'Attivo', categoria: 'Lavorazione' },
    { id: 'lin-003', nome: 'Linea 3', descrizione: 'Backup picchi stagionali', stato: 'Inattivo', categoria: 'Lavorazione' }
  ],
  sigleLotto: [
    { id: 'sig-001', nome: 'S24', descrizione: 'Stagione 2024', stato: 'Attivo', categoria: 'Stagionale' },
    { id: 'sig-002', nome: 'EXP', descrizione: 'Lotti destinati export', stato: 'Attivo', categoria: 'Export' }
  ],
  lottiIngresso: [
    { id: 'lot-001', nome: 'Lotto 2012-012', descrizione: 'Produttore Rossi, conferimento mattina', stato: 'Attivo', categoria: 'Conferito oggi' },
    { id: 'lot-002', nome: 'Lotto 2012-034', descrizione: 'Produttore Verdi, conferimento sera', stato: 'Inattivo', categoria: 'Storico' }
  ]
};

const createId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 6)}`;

export default function AnagrafichePage() {
  const [activeTab, setActiveTab] = useState<EntityKey>('prodottiGrezzi');
  const [rowsByTab, setRowsByTab] = useState<Record<EntityKey, EntityRow[]>>(INITIAL_DATA);

  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Attivo' | 'Inattivo'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [onlyActive, setOnlyActive] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>('nome');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formDescrizione, setFormDescrizione] = useState('');
  const [formCategoria, setFormCategoria] = useState('Generale');
  const [formStato, setFormStato] = useState<'Attivo' | 'Inattivo'>('Attivo');

  const activeTabConfig = TABS.find((tab) => tab.key === activeTab)!;
  const allRows = rowsByTab[activeTab];

  const categoryOptions = useMemo(() => {
    const unique = new Set(allRows.map((row) => row.categoria).filter(Boolean));
    return ['all', ...Array.from(unique)] as string[];
  }, [allRows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allRows
      .filter((row) => {
        if (query.length === 0) return true;
        return `${row.nome} ${row.descrizione}`.toLowerCase().includes(query);
      })
      .filter((row) => (onlyActive ? row.stato === 'Attivo' : true))
      .filter((row) => (statusFilter === 'all' ? true : row.stato === statusFilter))
      .filter((row) => (categoryFilter === 'all' ? true : row.categoria === categoryFilter));
  }, [allRows, search, onlyActive, statusFilter, categoryFilter]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      const order = String(aValue).localeCompare(String(bValue), 'it');
      return sortDirection === 'asc' ? order : -order;
    });
  }, [filteredRows, sortKey, sortDirection]);

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection('asc');
      return;
    }
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const openCreate = () => {
    setEditingId(null);
    setFormNome('');
    setFormDescrizione('');
    setFormCategoria('Generale');
    setFormStato('Attivo');
    setIsModalOpen(true);
  };

  const openEdit = (row: EntityRow) => {
    setEditingId(row.id);
    setFormNome(row.nome);
    setFormDescrizione(row.descrizione);
    setFormCategoria(row.categoria ?? 'Generale');
    setFormStato(row.stato);
    setIsModalOpen(true);
  };

  const saveEntity = (event: FormEvent) => {
    event.preventDefault();
    const nome = formNome.trim();
    const descrizione = formDescrizione.trim();
    if (!nome || !descrizione) return;

    setRowsByTab((prev) => {
      const current = prev[activeTab];
      const nextRow: EntityRow = {
        id: editingId ?? createId(activeTab.slice(0, 3)),
        nome,
        descrizione,
        stato: formStato,
        categoria: formCategoria
      };

      const updated = editingId
        ? current.map((row) => (row.id === editingId ? nextRow : row))
        : [...current, nextRow];

      return { ...prev, [activeTab]: updated };
    });

    setIsModalOpen(false);
  };

  const toggleStatus = (id: string) => {
    setRowsByTab((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((row) =>
        row.id === id ? { ...row, stato: row.stato === 'Attivo' ? 'Inattivo' : 'Attivo' } : row
      )
    }));
  };

  return (
    <section className="space-y-6 pb-4">
      <header className="sticky top-0 z-20 -mx-4 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="text-2xl font-bold tracking-tight text-[#2563EB]">MONITO</span>
            <nav className="hidden items-center gap-1 text-sm text-slate-600 md:flex">
              <button className="rounded-md px-3 py-2 hover:bg-slate-100">Cruscotto</button>
              <button className="rounded-md px-3 py-2 hover:bg-slate-100">Report</button>
              <button className="rounded-md bg-[#E8EFFD] px-3 py-2 font-medium text-[#2563EB]">Anagrafiche</button>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-[#10B981]" />
              Online
            </span>
            <div className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700">Admin</div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1240px] space-y-4">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900">Anagrafiche</h1>
          <p className="mt-1 text-base text-slate-600">Gestisci prodotti, varietà, articoli, imballaggi, linee e lotti del sistema.</p>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-flex min-w-full gap-2 rounded-xl bg-slate-100 p-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Cerca ${activeTabConfig.singular.toLowerCase()}...`}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm md:w-[320px]"
            />
            <button
              onClick={() => setShowFilters((prev) => !prev)}
              className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700"
            >
              Filtri
            </button>
          </div>
          <button onClick={openCreate} className="h-10 rounded-lg bg-[#2563EB] px-4 text-sm font-semibold text-white">
            + Nuovo {activeTabConfig.singular}
          </button>
        </div>

        {showFilters && (
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
            <label className="space-y-1 text-sm text-slate-700">
              <span>Stato</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'all' | 'Attivo' | 'Inattivo')}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3"
              >
                <option value="all">Tutti</option>
                <option value="Attivo">Attivo</option>
                <option value="Inattivo">Inattivo</option>
              </select>
            </label>

            <label className="space-y-1 text-sm text-slate-700">
              <span>Categoria</span>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3"
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'Tutte' : option}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 pt-6 text-sm text-slate-700">
              <input type="checkbox" checked={onlyActive} onChange={(event) => setOnlyActive(event.target.checked)} />
              Mostra solo record attivi
            </label>
          </div>
        )}

        <p className="text-sm text-slate-600">{sortedRows.length} risultati</p>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <SortableTh label="Nome" active={sortKey === 'nome'} direction={sortDirection} onClick={() => toggleSort('nome')} />
                  <SortableTh
                    label="Descrizione"
                    active={sortKey === 'descrizione'}
                    direction={sortDirection}
                    onClick={() => toggleSort('descrizione')}
                  />
                  <SortableTh label="Stato" active={sortKey === 'stato'} direction={sortDirection} onClick={() => toggleSort('stato')} />
                  <th className="px-4 py-3 text-right text-sm font-semibold">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-200">
                    <td className="px-4 py-3 text-base text-slate-900">{row.nome}</td>
                    <td className="px-4 py-3 text-base text-slate-800">{row.descrizione}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          row.stato === 'Attivo'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {row.stato}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3 text-sm">
                        <button onClick={() => openEdit(row)} className="text-[#2563EB] hover:underline">
                          Modifica
                        </button>
                        <button
                          onClick={() => toggleStatus(row.id)}
                          className={row.stato === 'Attivo' ? 'text-red-500 hover:underline' : 'text-emerald-600 hover:underline'}
                        >
                          {row.stato === 'Attivo' ? 'Disattiva' : 'Riattiva'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {sortedRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">
                      Nessun elemento trovato. Modifica i filtri o crea un nuovo record.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Modifica record' : `Nuovo ${activeTabConfig.singular}`}</h2>
            <form className="mt-4 space-y-3" onSubmit={saveEntity}>
              <label className="block space-y-1 text-sm text-slate-700">
                <span>Nome</span>
                <input
                  value={formNome}
                  onChange={(event) => setFormNome(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 px-3"
                  required
                />
              </label>

              <label className="block space-y-1 text-sm text-slate-700">
                <span>Descrizione</span>
                <input
                  value={formDescrizione}
                  onChange={(event) => setFormDescrizione(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 px-3"
                  required
                />
              </label>

              <label className="block space-y-1 text-sm text-slate-700">
                <span>Categoria</span>
                <input
                  value={formCategoria}
                  onChange={(event) => setFormCategoria(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 px-3"
                />
              </label>

              <label className="block space-y-1 text-sm text-slate-700">
                <span>Stato</span>
                <select
                  value={formStato}
                  onChange={(event) => setFormStato(event.target.value as 'Attivo' | 'Inattivo')}
                  className="h-10 w-full rounded-lg border border-slate-300 px-3"
                >
                  <option value="Attivo">Attivo</option>
                  <option value="Inattivo">Inattivo</option>
                </select>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
                  Annulla
                </button>
                <button type="submit" className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">
                  Salva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function SortableTh({
  label,
  active,
  direction,
  onClick
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-3 text-left text-sm font-semibold">
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1">
        {label}
        <span className="text-slate-400">{active ? (direction === 'asc' ? '↑' : '↓') : '↕'}</span>
      </button>
    </th>
  );
}
