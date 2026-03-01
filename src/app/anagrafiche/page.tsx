'use client';

import { FormEvent, ReactNode, useMemo, useState } from 'react';

type EntityKey =
  | 'prodottiGrezzi'
  | 'varieta'
  | 'articoli'
  | 'imballaggiSecondari'
  | 'linee'
  | 'sigleLotto'
  | 'lottiIngresso';

type BaseRecord = {
  id: string;
  nome: string;
  attivo: boolean;
};

type ProdottoGrezzo = BaseRecord & { categoria: 'Frutta' | 'Ortaggi' | 'Altro' };
type Varieta = BaseRecord & { prodottoGrezzoId: string };
type Articolo = BaseRecord & { varietaId: string; pesoPerCollo: number; pesoVariabile: boolean };
type ImballaggioSecondario = BaseRecord & { formato: 'Cartone' | 'Bins' | 'Cassa' };
type Linea = BaseRecord & { area: 'Confezionamento' | 'Lavorazione' | 'Carico' };
type SiglaLotto = BaseRecord & { prefisso: string };
type LottoIngresso = BaseRecord & { siglaLottoId: string; lineaId: string; dataConferimento: string };

type EntityDataMap = {
  prodottiGrezzi: ProdottoGrezzo[];
  varieta: Varieta[];
  articoli: Articolo[];
  imballaggiSecondari: ImballaggioSecondario[];
  linee: Linea[];
  sigleLotto: SiglaLotto[];
  lottiIngresso: LottoIngresso[];
};

type ColumnDef<T extends BaseRecord> = {
  key: string;
  label: string;
  sortable?: boolean;
  render: (record: T) => string | number | ReactNode;
  sortValue?: (record: T) => string | number;
};

type SortState = {
  key: string;
  direction: 'asc' | 'desc';
};

type DataTableProps<T extends BaseRecord> = {
  rows: T[];
  columns: ColumnDef<T>[];
  title: string;
  subtitle: string;
  searchPlaceholder?: string;
  dropdownFilters?: Array<{
    key: string;
    label: string;
    options: Array<{ label: string; value: string }>;
    getValue: (record: T) => string;
  }>;
  onEdit: (record: T) => void;
  onDelete: (record: T) => void;
  onToggleStatus: (record: T) => void;
};

const TAB_LABELS: Record<EntityKey, string> = {
  prodottiGrezzi: 'Prodotti Grezzi',
  varieta: 'Varietà',
  articoli: 'Articoli',
  imballaggiSecondari: 'Imballaggi Secondari',
  linee: 'Linee',
  sigleLotto: 'Sigle Lotto',
  lottiIngresso: 'Lotti Ingresso'
};

const initialData: EntityDataMap = {
  prodottiGrezzi: [
    { id: 'PG-001', nome: 'Uva da Tavola', categoria: 'Frutta', attivo: true },
    { id: 'PG-002', nome: 'Pomodoro', categoria: 'Ortaggi', attivo: true },
    { id: 'PG-003', nome: 'Melanzana', categoria: 'Ortaggi', attivo: false }
  ],
  varieta: [
    { id: 'VAR-001', nome: 'Crimson', prodottoGrezzoId: 'PG-001', attivo: true },
    { id: 'VAR-002', nome: 'Italia', prodottoGrezzoId: 'PG-001', attivo: true },
    { id: 'VAR-003', nome: 'Datterino', prodottoGrezzoId: 'PG-002', attivo: true }
  ],
  articoli: [
    { id: 'ART-001', nome: 'Vaschetta 500g', varietaId: 'VAR-001', pesoPerCollo: 5, pesoVariabile: false, attivo: true },
    { id: 'ART-002', nome: 'Cassetta 7kg', varietaId: 'VAR-003', pesoPerCollo: 7, pesoVariabile: true, attivo: true }
  ],
  imballaggiSecondari: [
    { id: 'IMB-001', nome: 'Cartone 30x40', formato: 'Cartone', attivo: true },
    { id: 'IMB-002', nome: 'Bins Standard', formato: 'Bins', attivo: true }
  ],
  linee: [
    { id: 'LIN-001', nome: 'Linea 1', area: 'Confezionamento', attivo: true },
    { id: 'LIN-002', nome: 'Linea 2', area: 'Lavorazione', attivo: true }
  ],
  sigleLotto: [
    { id: 'SIG-001', nome: 'Stagione 24', prefisso: 'S24', attivo: true },
    { id: 'SIG-002', nome: 'Export', prefisso: 'EXP', attivo: true }
  ],
  lottiIngresso: [
    {
      id: 'LOT-001',
      nome: 'Conferimento Mattina',
      siglaLottoId: 'SIG-001',
      lineaId: 'LIN-001',
      dataConferimento: '2026-02-15',
      attivo: true
    }
  ]
};

const createId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

export default function AnagrafichePage() {
  const [activeTab, setActiveTab] = useState<EntityKey>('prodottiGrezzi');
  const [data, setData] = useState<EntityDataMap>(initialData);
  const [connectionStatus] = useState<'online' | 'offline'>('online');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const [formState, setFormState] = useState<Record<string, string | boolean>>({
    nome: '',
    attivo: true,
    categoria: 'Frutta',
    prodottoGrezzoId: '',
    varietaId: '',
    formato: 'Cartone',
    area: 'Confezionamento',
    prefisso: '',
    siglaLottoId: '',
    lineaId: '',
    pesoPerCollo: '0',
    pesoVariabile: false,
    dataConferimento: new Date().toISOString().slice(0, 10)
  });

  const prodottiAttivi = useMemo(() => data.prodottiGrezzi.filter((item) => item.attivo), [data.prodottiGrezzi]);

  const varietaFilteredByProduct = useMemo(() => {
    const selectedProduct = String(formState.prodottoGrezzoId || prodottiAttivi[0]?.id || '');
    return data.varieta.filter((item) => item.prodottoGrezzoId === selectedProduct && item.attivo);
  }, [data.varieta, formState.prodottoGrezzoId, prodottiAttivi]);

  const varietaAttive = useMemo(() => data.varieta.filter((item) => item.attivo), [data.varieta]);
  const lineeAttive = useMemo(() => data.linee.filter((item) => item.attivo), [data.linee]);
  const sigleAttive = useMemo(() => data.sigleLotto.filter((item) => item.attivo), [data.sigleLotto]);

  const currentRows = data[activeTab];

  const openCreateModal = () => {
    setEditingRecordId(null);
    setFormState({
      nome: '',
      attivo: true,
      categoria: 'Frutta',
      prodottoGrezzoId: prodottiAttivi[0]?.id ?? '',
      varietaId: varietaAttive[0]?.id ?? '',
      formato: 'Cartone',
      area: 'Confezionamento',
      prefisso: '',
      siglaLottoId: sigleAttive[0]?.id ?? '',
      lineaId: lineeAttive[0]?.id ?? '',
      pesoPerCollo: '0',
      pesoVariabile: false,
      dataConferimento: new Date().toISOString().slice(0, 10)
    });
    setIsModalOpen(true);
  };

  const openEditModal = (record: BaseRecord) => {
    setEditingRecordId(record.id);
    setFormState(record as unknown as Record<string, string | boolean>);
    setIsModalOpen(true);
  };

  const saveRecord = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nome = String(formState.nome || '').trim();
    if (!nome) return;

    const isEditing = Boolean(editingRecordId);

    setData((prev) => {
      const next = { ...prev };

      const applyBase = {
        id: editingRecordId ?? createId(activeTab.slice(0, 3).toUpperCase()),
        nome,
        attivo: Boolean(formState.attivo)
      };

      const upsert = <T extends BaseRecord>(items: T[], payload: T): T[] => {
        if (!isEditing) return [...items, payload];
        return items.map((item) => (item.id === editingRecordId ? payload : item));
      };

      switch (activeTab) {
        case 'prodottiGrezzi': {
          const payload: ProdottoGrezzo = {
            ...applyBase,
            categoria: String(formState.categoria) as ProdottoGrezzo['categoria']
          };
          next.prodottiGrezzi = upsert(next.prodottiGrezzi, payload);
          break;
        }
        case 'varieta': {
          const payload: Varieta = {
            ...applyBase,
            prodottoGrezzoId: String(formState.prodottoGrezzoId)
          };
          next.varieta = upsert(next.varieta, payload);
          break;
        }
        case 'articoli': {
          const pesoPerCollo = Number(formState.pesoPerCollo);
          if (Number.isNaN(pesoPerCollo) || pesoPerCollo <= 0) return prev;
          const payload: Articolo = {
            ...applyBase,
            varietaId: String(formState.varietaId),
            pesoPerCollo,
            pesoVariabile: Boolean(formState.pesoVariabile)
          };
          next.articoli = upsert(next.articoli, payload);
          break;
        }
        case 'imballaggiSecondari': {
          const payload: ImballaggioSecondario = {
            ...applyBase,
            formato: String(formState.formato) as ImballaggioSecondario['formato']
          };
          next.imballaggiSecondari = upsert(next.imballaggiSecondari, payload);
          break;
        }
        case 'linee': {
          const payload: Linea = {
            ...applyBase,
            area: String(formState.area) as Linea['area']
          };
          next.linee = upsert(next.linee, payload);
          break;
        }
        case 'sigleLotto': {
          const payload: SiglaLotto = {
            ...applyBase,
            prefisso: String(formState.prefisso || '').trim().toUpperCase()
          };
          next.sigleLotto = upsert(next.sigleLotto, payload);
          break;
        }
        case 'lottiIngresso': {
          const payload: LottoIngresso = {
            ...applyBase,
            siglaLottoId: String(formState.siglaLottoId),
            lineaId: String(formState.lineaId),
            dataConferimento: String(formState.dataConferimento)
          };
          next.lottiIngresso = upsert(next.lottiIngresso, payload);
          break;
        }
      }

      return next;
    });

    setIsModalOpen(false);
  };

  const deleteRecord = (key: EntityKey, id: string) => {
    setData((prev) => ({
      ...prev,
      [key]: prev[key].filter((item) => item.id !== id)
    }));
  };

  const toggleStatus = (key: EntityKey, id: string) => {
    setData((prev) => ({
      ...prev,
      [key]: prev[key].map((item) => (item.id === id ? { ...item, attivo: !item.attivo } : item))
    }));
  };

  const productNameById = (id: string) => data.prodottiGrezzi.find((item) => item.id === id)?.nome ?? 'N/D';
  const varietaNameById = (id: string) => data.varieta.find((item) => item.id === id)?.nome ?? 'N/D';
  const lineaNameById = (id: string) => data.linee.find((item) => item.id === id)?.nome ?? 'N/D';
  const siglaNameById = (id: string) => data.sigleLotto.find((item) => item.id === id)?.prefisso ?? 'N/D';

  const tableConfig = {
    prodottiGrezzi: {
      title: 'Catalogo Prodotti Grezzi',
      subtitle: 'Gestisci i prodotti principali e la loro categoria merceologica.',
      columns: [
        { key: 'id', label: 'Codice', sortable: true, render: (r: ProdottoGrezzo) => r.id, sortValue: (r: ProdottoGrezzo) => r.id },
        { key: 'nome', label: 'Nome', sortable: true, render: (r: ProdottoGrezzo) => r.nome, sortValue: (r: ProdottoGrezzo) => r.nome },
        { key: 'categoria', label: 'Categoria', sortable: true, render: (r: ProdottoGrezzo) => r.categoria, sortValue: (r: ProdottoGrezzo) => r.categoria }
      ] as ColumnDef<ProdottoGrezzo>[],
      filters: [
        {
          key: 'categoria',
          label: 'Categoria',
          options: [
            { label: 'Tutte', value: 'all' },
            { label: 'Frutta', value: 'Frutta' },
            { label: 'Ortaggi', value: 'Ortaggi' },
            { label: 'Altro', value: 'Altro' }
          ],
          getValue: (r: ProdottoGrezzo) => r.categoria
        }
      ]
    },
    varieta: {
      title: 'Anagrafica Varietà',
      subtitle: 'Associa le varietà al relativo prodotto grezzo.',
      columns: [
        { key: 'id', label: 'Codice', sortable: true, render: (r: Varieta) => r.id, sortValue: (r: Varieta) => r.id },
        { key: 'nome', label: 'Nome', sortable: true, render: (r: Varieta) => r.nome, sortValue: (r: Varieta) => r.nome },
        {
          key: 'prodotto',
          label: 'Prodotto Grezzo',
          sortable: true,
          render: (r: Varieta) => productNameById(r.prodottoGrezzoId),
          sortValue: (r: Varieta) => productNameById(r.prodottoGrezzoId)
        }
      ] as ColumnDef<Varieta>[],
      filters: [
        {
          key: 'prodottoGrezzoId',
          label: 'Prodotto',
          options: [{ label: 'Tutti', value: 'all' }, ...data.prodottiGrezzi.map((p) => ({ label: p.nome, value: p.id }))],
          getValue: (r: Varieta) => r.prodottoGrezzoId
        }
      ]
    },
    articoli: {
      title: 'Catalogo Articoli',
      subtitle: 'Configura peso, tipo collo e legame con varietà.',
      columns: [
        { key: 'id', label: 'Codice', sortable: true, render: (r: Articolo) => r.id, sortValue: (r: Articolo) => r.id },
        { key: 'nome', label: 'Articolo', sortable: true, render: (r: Articolo) => r.nome, sortValue: (r: Articolo) => r.nome },
        { key: 'varieta', label: 'Varietà', sortable: true, render: (r: Articolo) => varietaNameById(r.varietaId), sortValue: (r: Articolo) => varietaNameById(r.varietaId) },
        { key: 'peso', label: 'Peso/collo', sortable: true, render: (r: Articolo) => `${r.pesoPerCollo} kg`, sortValue: (r: Articolo) => r.pesoPerCollo },
        { key: 'variabile', label: 'Variabile', sortable: true, render: (r: Articolo) => (r.pesoVariabile ? 'Sì' : 'No'), sortValue: (r: Articolo) => (r.pesoVariabile ? 1 : 0) }
      ] as ColumnDef<Articolo>[],
      filters: [
        {
          key: 'varietaId',
          label: 'Varietà',
          options: [{ label: 'Tutte', value: 'all' }, ...data.varieta.map((v) => ({ label: v.nome, value: v.id }))],
          getValue: (r: Articolo) => r.varietaId
        }
      ]
    },
    imballaggiSecondari: {
      title: 'Imballaggi Secondari',
      subtitle: 'Gestione rapida dei formati disponibili per confezionamento.',
      columns: [
        { key: 'id', label: 'Codice', sortable: true, render: (r: ImballaggioSecondario) => r.id, sortValue: (r: ImballaggioSecondario) => r.id },
        { key: 'nome', label: 'Nome', sortable: true, render: (r: ImballaggioSecondario) => r.nome, sortValue: (r: ImballaggioSecondario) => r.nome },
        { key: 'formato', label: 'Formato', sortable: true, render: (r: ImballaggioSecondario) => r.formato, sortValue: (r: ImballaggioSecondario) => r.formato }
      ] as ColumnDef<ImballaggioSecondario>[],
      filters: []
    },
    linee: {
      title: 'Linee di Produzione',
      subtitle: 'Associa le linee operative alle aree di stabilimento.',
      columns: [
        { key: 'id', label: 'Codice', sortable: true, render: (r: Linea) => r.id, sortValue: (r: Linea) => r.id },
        { key: 'nome', label: 'Linea', sortable: true, render: (r: Linea) => r.nome, sortValue: (r: Linea) => r.nome },
        { key: 'area', label: 'Area', sortable: true, render: (r: Linea) => r.area, sortValue: (r: Linea) => r.area }
      ] as ColumnDef<Linea>[],
      filters: []
    },
    sigleLotto: {
      title: 'Sigle Lotto',
      subtitle: 'Definisci i prefissi usati per la composizione dei lotti.',
      columns: [
        { key: 'id', label: 'Codice', sortable: true, render: (r: SiglaLotto) => r.id, sortValue: (r: SiglaLotto) => r.id },
        { key: 'nome', label: 'Descrizione', sortable: true, render: (r: SiglaLotto) => r.nome, sortValue: (r: SiglaLotto) => r.nome },
        { key: 'prefisso', label: 'Prefisso', sortable: true, render: (r: SiglaLotto) => r.prefisso, sortValue: (r: SiglaLotto) => r.prefisso }
      ] as ColumnDef<SiglaLotto>[],
      filters: []
    },
    lottiIngresso: {
      title: 'Registro Lotti Ingresso',
      subtitle: 'Monitora conferimenti, linea di destinazione e sigla lotto.',
      columns: [
        { key: 'id', label: 'Codice', sortable: true, render: (r: LottoIngresso) => r.id, sortValue: (r: LottoIngresso) => r.id },
        { key: 'nome', label: 'Conferimento', sortable: true, render: (r: LottoIngresso) => r.nome, sortValue: (r: LottoIngresso) => r.nome },
        { key: 'siglaLottoId', label: 'Sigla', sortable: true, render: (r: LottoIngresso) => siglaNameById(r.siglaLottoId), sortValue: (r: LottoIngresso) => siglaNameById(r.siglaLottoId) },
        { key: 'lineaId', label: 'Linea', sortable: true, render: (r: LottoIngresso) => lineaNameById(r.lineaId), sortValue: (r: LottoIngresso) => lineaNameById(r.lineaId) },
        { key: 'dataConferimento', label: 'Data', sortable: true, render: (r: LottoIngresso) => r.dataConferimento, sortValue: (r: LottoIngresso) => r.dataConferimento }
      ] as ColumnDef<LottoIngresso>[],
      filters: [
        {
          key: 'lineaId',
          label: 'Linea',
          options: [{ label: 'Tutte', value: 'all' }, ...data.linee.map((l) => ({ label: l.nome, value: l.id }))],
          getValue: (r: LottoIngresso) => r.lineaId
        }
      ]
    }
  }[activeTab];

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Monito • Production Monitoring</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Gestione Anagrafica</h1>
            <p className="mt-1 text-sm text-slate-600">Interfaccia unica per filtrare, ordinare e aggiornare tutte le anagrafiche operative.</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
            <span className={`h-2.5 w-2.5 rounded-full ${connectionStatus === 'online' ? 'bg-[#10B981]' : 'bg-red-500'}`} />
            <span className="text-sm font-medium text-slate-700">{connectionStatus === 'online' ? 'Connesso' : 'Offline'}</span>
            <button className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-sm font-medium text-white">Sincronizza</button>
          </div>
        </div>
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {(Object.keys(TAB_LABELS) as EntityKey[]).map((tab) => (
            <button
              key={tab}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
                activeTab === tab
                  ? 'border-[#2563EB] bg-[#2563EB] text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </nav>
      </header>

      <DataTable
        rows={currentRows as BaseRecord[]}
        columns={tableConfig.columns as ColumnDef<BaseRecord>[]}
        title={tableConfig.title}
        subtitle={tableConfig.subtitle}
        dropdownFilters={tableConfig.filters as DataTableProps<BaseRecord>['dropdownFilters']}
        onEdit={openEditModal}
        onDelete={(record) => deleteRecord(activeTab, record.id)}
        onToggleStatus={(record) => toggleStatus(activeTab, record.id)}
      />

      <div className="flex justify-end">
        <button
          onClick={openCreateModal}
          className="rounded-xl bg-[#10B981] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
        >
          + Nuovo {TAB_LABELS[activeTab].slice(0, -1)}
        </button>
      </div>

      {isModalOpen && (
        <Modal title={`${editingRecordId ? 'Modifica' : 'Nuovo'} ${TAB_LABELS[activeTab]}`} onClose={() => setIsModalOpen(false)}>
          <form className="space-y-3" onSubmit={saveRecord}>
            <Field label="Nome">
              <input
                value={String(formState.nome ?? '')}
                onChange={(event) => setFormState((prev) => ({ ...prev, nome: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </Field>

            {activeTab === 'prodottiGrezzi' && (
              <Field label="Categoria">
                <select
                  value={String(formState.categoria)}
                  onChange={(event) => setFormState((prev) => ({ ...prev, categoria: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option>Frutta</option>
                  <option>Ortaggi</option>
                  <option>Altro</option>
                </select>
              </Field>
            )}

            {activeTab === 'varieta' && (
              <Field label="Prodotto Grezzo">
                <select
                  value={String(formState.prodottoGrezzoId)}
                  onChange={(event) => setFormState((prev) => ({ ...prev, prodottoGrezzoId: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {prodottiAttivi.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {activeTab === 'articoli' && (
              <>
                <Field label="Prodotto Grezzo">
                  <select
                    value={String(formState.prodottoGrezzoId || prodottiAttivi[0]?.id || '')}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        prodottoGrezzoId: event.target.value,
                        varietaId: data.varieta.find((v) => v.prodottoGrezzoId === event.target.value)?.id ?? ''
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {prodottiAttivi.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nome}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Varietà (filtrata)">
                  <select
                    value={String(formState.varietaId)}
                    onChange={(event) => setFormState((prev) => ({ ...prev, varietaId: event.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {varietaFilteredByProduct.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nome}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Peso per collo (kg)">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={String(formState.pesoPerCollo)}
                    onChange={(event) => setFormState((prev) => ({ ...prev, pesoPerCollo: event.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(formState.pesoVariabile)}
                    onChange={(event) => setFormState((prev) => ({ ...prev, pesoVariabile: event.target.checked }))}
                  />
                  Peso variabile
                </label>
              </>
            )}

            {activeTab === 'imballaggiSecondari' && (
              <Field label="Formato">
                <select
                  value={String(formState.formato)}
                  onChange={(event) => setFormState((prev) => ({ ...prev, formato: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option>Cartone</option>
                  <option>Bins</option>
                  <option>Cassa</option>
                </select>
              </Field>
            )}

            {activeTab === 'linee' && (
              <Field label="Area">
                <select
                  value={String(formState.area)}
                  onChange={(event) => setFormState((prev) => ({ ...prev, area: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option>Confezionamento</option>
                  <option>Lavorazione</option>
                  <option>Carico</option>
                </select>
              </Field>
            )}

            {activeTab === 'sigleLotto' && (
              <Field label="Prefisso">
                <input
                  value={String(formState.prefisso ?? '')}
                  onChange={(event) => setFormState((prev) => ({ ...prev, prefisso: event.target.value.toUpperCase() }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </Field>
            )}

            {activeTab === 'lottiIngresso' && (
              <>
                <Field label="Sigla Lotto">
                  <select
                    value={String(formState.siglaLottoId)}
                    onChange={(event) => setFormState((prev) => ({ ...prev, siglaLottoId: event.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {sigleAttive.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nome}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Linea">
                  <select
                    value={String(formState.lineaId)}
                    onChange={(event) => setFormState((prev) => ({ ...prev, lineaId: event.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {lineeAttive.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nome}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Data conferimento">
                  <input
                    type="date"
                    value={String(formState.dataConferimento)}
                    onChange={(event) => setFormState((prev) => ({ ...prev, dataConferimento: event.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </Field>
              </>
            )}

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(formState.attivo)}
                onChange={(event) => setFormState((prev) => ({ ...prev, attivo: event.target.checked }))}
              />
              Record attivo
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                Annulla
              </button>
              <button type="submit" className="rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white">
                Salva
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

function DataTable<T extends BaseRecord>({
  rows,
  columns,
  title,
  subtitle,
  searchPlaceholder = 'Cerca per nome o codice...',
  dropdownFilters = [],
  onEdit,
  onDelete,
  onToggleStatus
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [statusOnlyActive, setStatusOnlyActive] = useState(false);
  const [sort, setSort] = useState<SortState | null>(null);
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<Record<string, string>>(Object.fromEntries(dropdownFilters.map((f) => [f.key, 'all'])));

  const pageSize = 6;

  const filteredRows = useMemo(() => {
    const queryLower = query.trim().toLowerCase();
    return rows
      .filter((record) => {
        if (statusOnlyActive && !record.attivo) return false;
        if (!queryLower) return true;
        return `${record.id} ${record.nome}`.toLowerCase().includes(queryLower);
      })
      .filter((record) =>
        dropdownFilters.every((filter) => {
          const selected = filterValues[filter.key] ?? 'all';
          if (selected === 'all') return true;
          return filter.getValue(record) === selected;
        })
      );
  }, [rows, query, statusOnlyActive, dropdownFilters, filterValues]);

  const sortedRows = useMemo(() => {
    if (!sort) return filteredRows;
    const targetColumn = columns.find((column) => column.key === sort.key);
    if (!targetColumn?.sortValue) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      const aVal = targetColumn.sortValue?.(a) ?? '';
      const bVal = targetColumn.sortValue?.(b) ?? '';
      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [columns, filteredRows, sort]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600">{subtitle}</p>
        </div>
        <div className="grid w-full gap-2 md:grid-cols-2 lg:w-auto lg:grid-cols-3">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
          />
          {dropdownFilters.map((filter) => (
            <select
              key={filter.key}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={filterValues[filter.key] ?? 'all'}
              onChange={(event) => {
                setFilterValues((prev) => ({ ...prev, [filter.key]: event.target.value }));
                setPage(1);
              }}
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {filter.label}: {opt.label}
                </option>
              ))}
            </select>
          ))}
          <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={statusOnlyActive}
              onChange={(event) => {
                setStatusOnlyActive(event.target.checked);
                setPage(1);
              }}
            />
            Solo attivi
          </label>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-3 pb-2 text-xs font-semibold uppercase text-slate-500">
                  <button
                    type="button"
                    disabled={!column.sortable}
                    className="inline-flex items-center gap-1 disabled:cursor-default"
                    onClick={() => {
                      if (!column.sortable) return;
                      setSort((prev) => {
                        if (!prev || prev.key !== column.key) return { key: column.key, direction: 'asc' };
                        return { key: column.key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
                      });
                    }}
                  >
                    {column.label}
                    {sort?.key === column.key ? (sort.direction === 'asc' ? '↑' : '↓') : ''}
                  </button>
                </th>
              ))}
              <th className="px-3 pb-2 text-xs font-semibold uppercase text-slate-500">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
                  Nessun record trovato con i filtri correnti.
                </td>
              </tr>
            ) : (
              pageRows.map((record) => (
                <tr key={record.id} className="rounded-xl bg-slate-50/80">
                  {columns.map((column) => (
                    <td key={`${record.id}-${column.key}`} className="whitespace-nowrap px-3 py-3 text-slate-700">
                      {column.render(record)}
                    </td>
                  ))}
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => onEdit(record)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium">
                        Modifica
                      </button>
                      <button
                        onClick={() => onToggleStatus(record)}
                        className={`rounded-lg px-2 py-1 text-xs font-medium text-white ${record.attivo ? 'bg-[#10B981]' : 'bg-slate-500'}`}
                      >
                        {record.attivo ? 'Attivo' : 'Disattivo'}
                      </button>
                      <button onClick={() => onDelete(record)} className="rounded-lg bg-[#F59E0B] px-2 py-1 text-xs font-medium text-white">
                        Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <p>
          Pagina {safePage} di {pageCount} • {sortedRows.length} record
        </p>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
            disabled={safePage <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Precedente
          </button>
          <button
            className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
            disabled={safePage >= pageCount}
            onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
          >
            Successiva
          </button>
        </div>
      </div>
    </article>
  );
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-2 py-1 text-sm">
            Chiudi
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1 text-sm text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}
