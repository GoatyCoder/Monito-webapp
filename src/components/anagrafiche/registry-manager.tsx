'use client';

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { REGISTRY_SCHEMA } from '@/lib/config/db';
import {
  createRegistryRow,
  fetchCurrentUser,
  fetchRegistryRowById,
  fetchRegistryTable,
  type RegistryTable,
  setRegistryRowActiveStatus,
  updateRegistryRow
} from '@/lib/db/registry-queries';
import { createSupabaseClient } from '@/lib/db/supabase-client';

type RegistryBase = {
  id: string;
  created_by: string;
  updated_by: string | null;
  is_active: boolean;
  deleted_at?: string | null;
  deleted_by?: string | null;
};

type ProdottoGrezzoRow = RegistryBase & {
  nome: string;
  descrizione: string | null;
};

type VarietaRow = RegistryBase & {
  nome: string;
  descrizione: string | null;
  prodotto_grezzo_id: string;
};

type ArticoloRow = RegistryBase & {
  nome: string;
  descrizione: string | null;
  peso_per_collo: number;
  peso_variabile: boolean;
  vincolo_prodotto_grezzo_id: string | null;
  vincolo_varieta_id: string | null;
};

type ImballaggioRow = RegistryBase & {
  nome: string;
  descrizione: string | null;
  tara_kg: number | null;
  lunghezza_cm: number | null;
  larghezza_cm: number | null;
  altezza_cm: number | null;
};

type LineaRow = RegistryBase & {
  nome: string;
  descrizione: string | null;
  ordine: number | null;
};

type SiglaLottoRow = RegistryBase & {
  codice: string;
  produttore: string;
  prodotto_grezzo_id: string;
  varieta_id: string;
  campo: string | null;
};

type RegistryData = {
  prodottiGrezzi: ProdottoGrezzoRow[];
  varieta: VarietaRow[];
  articoli: ArticoloRow[];
  imballaggi: ImballaggioRow[];
  linee: LineaRow[];
  sigleLotto: SiglaLottoRow[];
};

type RegistryRecord =
  | ProdottoGrezzoRow
  | VarietaRow
  | ArticoloRow
  | ImballaggioRow
  | LineaRow
  | SiglaLottoRow;

type SortDirection = 'asc' | 'desc';

type SortConfig = {
  key: string;
  direction: SortDirection;
};

type ModalState =
  | {
      mode: 'create';
      table: RegistryTable;
    }
  | {
      mode: 'edit';
      table: RegistryTable;
      row: RegistryRecord;
    }
  | null;

type TableColumn = {
  key: string;
  label: string;
  className?: string;
  getValue: (row: RegistryRecord) => string | number | boolean | null;
  render: (row: RegistryRecord) => ReactNode;
};

const TAB_CONFIG: { key: RegistryTable; label: string; description: string }[] = [
  { key: 'prodotti_grezzi', label: 'Prodotti grezzi', description: 'Gestione materie prime di base' },
  { key: 'varieta', label: 'Varietà', description: 'Catalogo varietà collegate ai prodotti grezzi' },
  { key: 'articoli', label: 'Articoli', description: 'Anagrafica articoli di confezionamento' },
  { key: 'imballaggi_secondari', label: 'Imballaggi', description: 'Contenitori secondari e misure' },
  { key: 'linee', label: 'Linee', description: 'Linee di produzione e ordinamento dashboard' },
  { key: 'sigle_lotto', label: 'Sigle lotto', description: 'Codici lotto e produttore di riferimento' }
];

const PAGE_SIZE = 8;

function parseNumberOrNull(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeString(value: FormDataEntryValue | null): string {
  return String(value ?? '').trim();
}

function getRowsByTable(data: RegistryData, table: RegistryTable): RegistryRecord[] {
  switch (table) {
    case 'prodotti_grezzi':
      return data.prodottiGrezzi;
    case 'varieta':
      return data.varieta;
    case 'articoli':
      return data.articoli;
    case 'imballaggi_secondari':
      return data.imballaggi;
    case 'linee':
      return data.linee;
    case 'sigle_lotto':
      return data.sigleLotto;
  }
}

function getDefaultSortState(): Record<RegistryTable, SortConfig> {
  return {
    prodotti_grezzi: { key: 'nome', direction: 'asc' },
    varieta: { key: 'nome', direction: 'asc' },
    articoli: { key: 'nome', direction: 'asc' },
    imballaggi_secondari: { key: 'nome', direction: 'asc' },
    linee: { key: 'ordine', direction: 'asc' },
    sigle_lotto: { key: 'codice', direction: 'asc' }
  };
}

function getTableColumns(
  table: RegistryTable,
  prodottoById: Map<string, string>,
  varietaById: Map<string, string>
): TableColumn[] {
  switch (table) {
    case 'prodotti_grezzi':
      return [
        {
          key: 'nome',
          label: 'Nome',
          getValue: (row) => ('nome' in row ? row.nome : ''),
          render: (row) => ('nome' in row ? row.nome : '')
        },
        {
          key: 'descrizione',
          label: 'Descrizione',
          getValue: (row) => ('descrizione' in row ? (row.descrizione ?? '') : ''),
          render: (row) => ('descrizione' in row ? (row.descrizione ?? '—') : '—')
        }
      ];
    case 'varieta':
      return [
        {
          key: 'nome',
          label: 'Nome',
          getValue: (row) => ('nome' in row ? row.nome : ''),
          render: (row) => ('nome' in row ? row.nome : '')
        },
        {
          key: 'prodotto_grezzo_id',
          label: 'Prodotto grezzo',
          getValue: (row) => ('prodotto_grezzo_id' in row ? prodottoById.get(row.prodotto_grezzo_id) ?? '' : ''),
          render: (row) =>
            'prodotto_grezzo_id' in row ? (prodottoById.get(row.prodotto_grezzo_id) ?? 'Non associato') : '—'
        },
        {
          key: 'descrizione',
          label: 'Descrizione',
          getValue: (row) => ('descrizione' in row ? (row.descrizione ?? '') : ''),
          render: (row) => ('descrizione' in row ? (row.descrizione ?? '—') : '—')
        }
      ];
    case 'articoli':
      return [
        {
          key: 'nome',
          label: 'Nome',
          getValue: (row) => ('nome' in row ? row.nome : ''),
          render: (row) => ('nome' in row ? row.nome : '')
        },
        {
          key: 'peso_per_collo',
          label: 'Peso/collo',
          getValue: (row) => ('peso_per_collo' in row ? row.peso_per_collo : 0),
          render: (row) => ('peso_per_collo' in row ? `${row.peso_per_collo} kg` : '—')
        },
        {
          key: 'peso_variabile',
          label: 'Peso variabile',
          getValue: (row) => ('peso_variabile' in row ? row.peso_variabile : false),
          render: (row) => ('peso_variabile' in row ? (row.peso_variabile ? 'Sì' : 'No') : 'No')
        },
        {
          key: 'vincolo_prodotto_grezzo_id',
          label: 'Vincoli',
          getValue: (row) => {
            if (!('vincolo_prodotto_grezzo_id' in row) || !('vincolo_varieta_id' in row)) {
              return '';
            }
            return `${prodottoById.get(row.vincolo_prodotto_grezzo_id ?? '') ?? ''} ${varietaById.get(row.vincolo_varieta_id ?? '') ?? ''}`;
          },
          render: (row) => {
            if (!('vincolo_prodotto_grezzo_id' in row) || !('vincolo_varieta_id' in row)) {
              return 'Nessun vincolo';
            }
            const prodotto = row.vincolo_prodotto_grezzo_id
              ? (prodottoById.get(row.vincolo_prodotto_grezzo_id) ?? 'Prodotto non trovato')
              : null;
            const varieta = row.vincolo_varieta_id ? (varietaById.get(row.vincolo_varieta_id) ?? 'Varietà non trovata') : null;
            if (!prodotto && !varieta) {
              return 'Nessun vincolo';
            }
            return `${prodotto ?? '—'} / ${varieta ?? '—'}`;
          }
        }
      ];
    case 'imballaggi_secondari':
      return [
        {
          key: 'nome',
          label: 'Nome',
          getValue: (row) => ('nome' in row ? row.nome : ''),
          render: (row) => ('nome' in row ? row.nome : '')
        },
        {
          key: 'tara_kg',
          label: 'Tara',
          getValue: (row) => ('tara_kg' in row ? (row.tara_kg ?? 0) : 0),
          render: (row) => ('tara_kg' in row ? (row.tara_kg !== null ? `${row.tara_kg} kg` : '—') : '—')
        },
        {
          key: 'dimensioni',
          label: 'Dimensioni (cm)',
          getValue: (row) => {
            if (!('lunghezza_cm' in row) || !('larghezza_cm' in row) || !('altezza_cm' in row)) {
              return '';
            }
            return `${row.lunghezza_cm ?? ''}-${row.larghezza_cm ?? ''}-${row.altezza_cm ?? ''}`;
          },
          render: (row) => {
            if (!('lunghezza_cm' in row) || !('larghezza_cm' in row) || !('altezza_cm' in row)) {
              return '—';
            }
            const lunghezza = row.lunghezza_cm ?? '—';
            const larghezza = row.larghezza_cm ?? '—';
            const altezza = row.altezza_cm ?? '—';
            return `${lunghezza} × ${larghezza} × ${altezza}`;
          }
        }
      ];
    case 'linee':
      return [
        {
          key: 'ordine',
          label: 'Ordine',
          getValue: (row) => ('ordine' in row ? (row.ordine ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER),
          render: (row) => ('ordine' in row ? (row.ordine ?? '—') : '—')
        },
        {
          key: 'nome',
          label: 'Nome',
          getValue: (row) => ('nome' in row ? row.nome : ''),
          render: (row) => ('nome' in row ? row.nome : '')
        },
        {
          key: 'descrizione',
          label: 'Descrizione',
          getValue: (row) => ('descrizione' in row ? (row.descrizione ?? '') : ''),
          render: (row) => ('descrizione' in row ? (row.descrizione ?? '—') : '—')
        }
      ];
    case 'sigle_lotto':
      return [
        {
          key: 'codice',
          label: 'Codice',
          getValue: (row) => ('codice' in row ? row.codice : ''),
          render: (row) => ('codice' in row ? row.codice : '')
        },
        {
          key: 'produttore',
          label: 'Produttore',
          getValue: (row) => ('produttore' in row ? row.produttore : ''),
          render: (row) => ('produttore' in row ? row.produttore : '')
        },
        {
          key: 'prodotto_grezzo_id',
          label: 'Prodotto / Varietà',
          getValue: (row) => {
            if (!('prodotto_grezzo_id' in row) || !('varieta_id' in row)) {
              return '';
            }
            return `${prodottoById.get(row.prodotto_grezzo_id) ?? ''} ${varietaById.get(row.varieta_id) ?? ''}`;
          },
          render: (row) => {
            if (!('prodotto_grezzo_id' in row) || !('varieta_id' in row)) {
              return '—';
            }
            return `${prodottoById.get(row.prodotto_grezzo_id) ?? 'Prodotto non trovato'} / ${varietaById.get(row.varieta_id) ?? 'Varietà non trovata'}`;
          }
        },
        {
          key: 'campo',
          label: 'Campo',
          getValue: (row) => ('campo' in row ? (row.campo ?? '') : ''),
          render: (row) => ('campo' in row ? (row.campo ?? '—') : '—')
        }
      ];
  }
}

function compareValues(a: string | number | boolean | null, b: string | number | boolean | null): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return Number(a) - Number(b);
  }

  return String(a ?? '').localeCompare(String(b ?? ''), 'it', { sensitivity: 'base' });
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-3 py-1 text-sm">
            Chiudi
          </button>
        </header>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function RegistryManager() {
  const [data, setData] = useState<RegistryData>({
    prodottiGrezzi: [],
    varieta: [],
    articoli: [],
    imballaggi: [],
    linee: [],
    sigleLotto: []
  });
  const [activeTab, setActiveTab] = useState<RegistryTable>('prodotti_grezzi');
  const [statusMessage, setStatusMessage] = useState('');
  const [modalState, setModalState] = useState<ModalState>(null);
  const [sortState, setSortState] = useState<Record<RegistryTable, SortConfig>>(getDefaultSortState);
  const [pageState, setPageState] = useState<Record<RegistryTable, number>>({
    prodotti_grezzi: 1,
    varieta: 1,
    articoli: 1,
    imballaggi_secondari: 1,
    linee: 1,
    sigle_lotto: 1
  });
  const [userIdentity, setUserIdentity] = useState<{ userId: string; actorName: string } | null>(null);

  const supabase = useMemo(() => createSupabaseClient(), []);

  const prodottoById = useMemo(
    () => new Map(data.prodottiGrezzi.map((prodotto) => [prodotto.id, prodotto.nome])),
    [data.prodottiGrezzi]
  );
  const varietaById = useMemo(() => new Map(data.varieta.map((row) => [row.id, row.nome])), [data.varieta]);

  const columns = useMemo(() => getTableColumns(activeTab, prodottoById, varietaById), [activeTab, prodottoById, varietaById]);

  const tableRows = useMemo(() => {
    const rows = getRowsByTable(data, activeTab);
    const sort = sortState[activeTab];
    const column = columns.find((item) => item.key === sort.key) ?? columns[0];

    const sorted = [...rows].sort((rowA, rowB) => {
      const result = compareValues(column.getValue(rowA), column.getValue(rowB));
      return sort.direction === 'asc' ? result : -result;
    });

    return sorted;
  }, [activeTab, columns, data, sortState]);

  const totalPages = Math.max(1, Math.ceil(tableRows.length / PAGE_SIZE));
  const currentPage = Math.min(pageState[activeTab], totalPages);
  const paginatedRows = tableRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const setPage = (table: RegistryTable, nextPage: number) => {
    setPageState((current) => ({ ...current, [table]: Math.max(1, nextPage) }));
  };

  function upsertLocalRow(table: RegistryTable, row: RegistryRecord) {
    setData((currentData) => {
      const upsert = <T extends RegistryRecord>(rows: T[]) => [
        ...rows.filter((existingRow) => existingRow.id !== row.id),
        row as T
      ];

      switch (table) {
        case 'prodotti_grezzi':
          return { ...currentData, prodottiGrezzi: upsert(currentData.prodottiGrezzi) };
        case 'varieta':
          return { ...currentData, varieta: upsert(currentData.varieta) };
        case 'articoli':
          return { ...currentData, articoli: upsert(currentData.articoli) };
        case 'imballaggi_secondari':
          return { ...currentData, imballaggi: upsert(currentData.imballaggi) };
        case 'linee':
          return { ...currentData, linee: upsert(currentData.linee) };
        case 'sigle_lotto':
          return { ...currentData, sigleLotto: upsert(currentData.sigleLotto) };
      }
    });
  }

  function validateSiglaLottoPairing(payload: Record<string, unknown>): string | null {
    const prodottoId = typeof payload.prodotto_grezzo_id === 'string' ? payload.prodotto_grezzo_id : '';
    const varietaId = typeof payload.varieta_id === 'string' ? payload.varieta_id : '';

    if (!prodottoId || !varietaId) {
      return null;
    }

    const selectedVarieta = data.varieta.find((varieta) => varieta.id === varietaId);
    if (!selectedVarieta) {
      return 'Varietà selezionata non trovata.';
    }

    if (selectedVarieta.prodotto_grezzo_id !== prodottoId) {
      return 'La varietà selezionata non appartiene al prodotto grezzo scelto.';
    }

    return null;
  }

  const loadRegistryData = useCallback(async () => {
    const [prodotti, varieta, articoli, imballaggi, linee, sigleLotto, userResponse] = await Promise.all([
      fetchRegistryTable(supabase, 'prodotti_grezzi', 'nome'),
      fetchRegistryTable(supabase, 'varieta', 'nome'),
      fetchRegistryTable(supabase, 'articoli', 'nome'),
      fetchRegistryTable(supabase, 'imballaggi_secondari', 'nome'),
      fetchRegistryTable(supabase, 'linee', 'ordine'),
      fetchRegistryTable(supabase, 'sigle_lotto', 'codice'),
      fetchCurrentUser(supabase)
    ]);

    const errors = [prodotti.error, varieta.error, articoli.error, imballaggi.error, linee.error, sigleLotto.error, userResponse.error].filter(
      (error) => error !== null
    );

    if (errors.length > 0) {
      setStatusMessage(`Errore caricamento anagrafiche: ${errors.map((error) => error.message).join('; ')}`);
      return;
    }

    setData({
      prodottiGrezzi: (prodotti.data ?? []) as ProdottoGrezzoRow[],
      varieta: (varieta.data ?? []) as VarietaRow[],
      articoli: (articoli.data ?? []) as ArticoloRow[],
      imballaggi: (imballaggi.data ?? []) as ImballaggioRow[],
      linee: (linee.data ?? []) as LineaRow[],
      sigleLotto: (sigleLotto.data ?? []) as SiglaLottoRow[]
    });

    const user = userResponse.data.user;
    if (user) {
      const fullName = user.user_metadata?.full_name;
      setUserIdentity({
        userId: user.id,
        actorName: typeof fullName === 'string' && fullName.trim() ? fullName : user.email ?? 'Utente'
      });
    }
  }, [supabase]);

  useEffect(() => {
    void loadRegistryData();
  }, [loadRegistryData]);

  async function logAuditEvent(params: {
    tableName: RegistryTable;
    recordId: string;
    action: 'insert' | 'update' | 'soft_delete' | 'restore';
    oldValue: Record<string, unknown> | null;
    newValue: Record<string, unknown> | null;
  }) {
    if (!userIdentity) {
      return;
    }

    await supabase.rpc('log_audit_event', {
      actor_id: userIdentity.userId,
      actor_name: userIdentity.actorName,
      schema_name: REGISTRY_SCHEMA,
      table_name: params.tableName,
      record_id: params.recordId,
      action: params.action,
      old_value: params.oldValue,
      new_value: params.newValue,
      reason: null
    });
  }

  async function createRecord(table: RegistryTable, payload: Record<string, unknown>) {
    if (!userIdentity) {
      setStatusMessage('Utente non disponibile. Ricarica la pagina.');
      return false;
    }

    if (table === 'sigle_lotto') {
      const incompatibilityError = validateSiglaLottoPairing(payload);
      if (incompatibilityError) {
        setStatusMessage(incompatibilityError);
        return false;
      }
    }

    const response = await createRegistryRow(supabase, table, payload, userIdentity.userId);
    if (response.error || !response.data) {
      setStatusMessage(`Errore creazione ${table}: ${response.error?.message ?? 'sconosciuto'}`);
      return false;
    }

    await logAuditEvent({
      tableName: table,
      recordId: response.data.id,
      action: 'insert',
      oldValue: null,
      newValue: response.data
    });

    upsertLocalRow(table, response.data as RegistryRecord);
    setStatusMessage('Record creato con successo.');
    return true;
  }

  async function editRecord(table: RegistryTable, rowId: string, payload: Record<string, unknown>) {
    if (!userIdentity) {
      setStatusMessage('Utente non disponibile. Ricarica la pagina.');
      return false;
    }

    if (table === 'sigle_lotto') {
      const incompatibilityError = validateSiglaLottoPairing(payload);
      if (incompatibilityError) {
        setStatusMessage(incompatibilityError);
        return false;
      }
    }

    const existing = await fetchRegistryRowById(supabase, table, rowId);
    if (existing.error || !existing.data) {
      setStatusMessage(`Errore lettura record ${table}: ${existing.error?.message ?? 'sconosciuto'}`);
      return false;
    }

    const response = await updateRegistryRow(supabase, table, rowId, payload, userIdentity.userId);
    if (response.error || !response.data) {
      setStatusMessage(`Errore aggiornamento ${table}: ${response.error?.message ?? 'sconosciuto'}`);
      return false;
    }

    await logAuditEvent({
      tableName: table,
      recordId: rowId,
      action: 'update',
      oldValue: existing.data,
      newValue: response.data
    });

    upsertLocalRow(table, response.data as RegistryRecord);
    setStatusMessage('Record aggiornato con successo.');
    return true;
  }

  async function toggleRecordActive(table: RegistryTable, row: RegistryRecord) {
    if (!userIdentity) {
      setStatusMessage('Utente non disponibile. Ricarica la pagina.');
      return;
    }

    const shouldRestore = row.is_active === false;

    const existing = await fetchRegistryRowById(supabase, table, row.id);
    if (existing.error || !existing.data) {
      setStatusMessage(`Errore lettura record ${table}: ${existing.error?.message ?? 'sconosciuto'}`);
      return;
    }

    const response = await setRegistryRowActiveStatus(supabase, table, row.id, shouldRestore, userIdentity.userId);
    if (response.error || !response.data) {
      setStatusMessage(
        `Errore ${shouldRestore ? 'ripristino' : 'disattivazione'} ${table}: ${response.error?.message ?? 'sconosciuto'}`
      );
      return;
    }

    await logAuditEvent({
      tableName: table,
      recordId: row.id,
      action: shouldRestore ? 'restore' : 'soft_delete',
      oldValue: existing.data,
      newValue: response.data
    });

    upsertLocalRow(table, response.data as RegistryRecord);
    setStatusMessage(shouldRestore ? 'Record ripristinato.' : 'Record disattivato.');
  }

  function extractPayload(table: RegistryTable, formData: FormData): Record<string, unknown> {
    switch (table) {
      case 'prodotti_grezzi':
        return {
          nome: normalizeString(formData.get('nome')),
          descrizione: normalizeString(formData.get('descrizione')) || null
        };
      case 'varieta':
        return {
          nome: normalizeString(formData.get('nome')),
          descrizione: normalizeString(formData.get('descrizione')) || null,
          prodotto_grezzo_id: normalizeString(formData.get('prodotto_grezzo_id'))
        };
      case 'articoli':
        return {
          nome: normalizeString(formData.get('nome')),
          descrizione: normalizeString(formData.get('descrizione')) || null,
          peso_per_collo: Number(normalizeString(formData.get('peso_per_collo')) || '0'),
          peso_variabile: normalizeString(formData.get('peso_variabile')) === 'on',
          vincolo_prodotto_grezzo_id: normalizeString(formData.get('vincolo_prodotto_grezzo_id')) || null,
          vincolo_varieta_id: normalizeString(formData.get('vincolo_varieta_id')) || null
        };
      case 'imballaggi_secondari':
        return {
          nome: normalizeString(formData.get('nome')),
          descrizione: normalizeString(formData.get('descrizione')) || null,
          tara_kg: parseNumberOrNull(normalizeString(formData.get('tara_kg'))),
          lunghezza_cm: parseNumberOrNull(normalizeString(formData.get('lunghezza_cm'))),
          larghezza_cm: parseNumberOrNull(normalizeString(formData.get('larghezza_cm'))),
          altezza_cm: parseNumberOrNull(normalizeString(formData.get('altezza_cm')))
        };
      case 'linee':
        return {
          nome: normalizeString(formData.get('nome')),
          descrizione: normalizeString(formData.get('descrizione')) || null,
          ordine: parseNumberOrNull(normalizeString(formData.get('ordine')))
        };
      case 'sigle_lotto':
        return {
          codice: normalizeString(formData.get('codice')),
          produttore: normalizeString(formData.get('produttore')),
          prodotto_grezzo_id: normalizeString(formData.get('prodotto_grezzo_id')),
          varieta_id: normalizeString(formData.get('varieta_id')),
          campo: normalizeString(formData.get('campo')) || null
        };
    }
  }

  async function onSubmitModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modalState) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = extractPayload(modalState.table, formData);

    const success =
      modalState.mode === 'create'
        ? await createRecord(modalState.table, payload)
        : await editRecord(modalState.table, modalState.row.id, payload);

    if (success) {
      setModalState(null);
    }
  }

  function renderFormFields(table: RegistryTable, row?: RegistryRecord) {
    const selectedProductId =
      table === 'sigle_lotto' && row && 'prodotto_grezzo_id' in row ? row.prodotto_grezzo_id : undefined;

    const filteredVarieta = selectedProductId
      ? data.varieta.filter((item) => item.prodotto_grezzo_id === selectedProductId)
      : data.varieta;

    switch (table) {
      case 'prodotti_grezzi':
        return (
          <>
            <label className="grid gap-1 text-sm">
              Nome
              <input name="nome" defaultValue={row && 'nome' in row ? row.nome : ''} required className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm">
              Descrizione
              <input name="descrizione" defaultValue={row && 'descrizione' in row ? (row.descrizione ?? '') : ''} className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
          </>
        );
      case 'varieta':
        return (
          <>
            <label className="grid gap-1 text-sm">
              Nome
              <input name="nome" defaultValue={row && 'nome' in row ? row.nome : ''} required className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm">
              Prodotto grezzo
              <select
                name="prodotto_grezzo_id"
                defaultValue={row && 'prodotto_grezzo_id' in row ? row.prodotto_grezzo_id : ''}
                required
                className="rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="">Seleziona prodotto</option>
                {data.prodottiGrezzi.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Descrizione
              <input name="descrizione" defaultValue={row && 'descrizione' in row ? (row.descrizione ?? '') : ''} className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
          </>
        );
      case 'articoli':
        return (
          <>
            <label className="grid gap-1 text-sm">
              Nome
              <input name="nome" defaultValue={row && 'nome' in row ? row.nome : ''} required className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm">
              Peso per collo (kg)
              <input
                type="number"
                name="peso_per_collo"
                min="0"
                step="0.01"
                defaultValue={row && 'peso_per_collo' in row ? row.peso_per_collo : ''}
                required
                className="rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              Vincolo prodotto grezzo
              <select
                name="vincolo_prodotto_grezzo_id"
                defaultValue={row && 'vincolo_prodotto_grezzo_id' in row ? (row.vincolo_prodotto_grezzo_id ?? '') : ''}
                className="rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="">Nessun vincolo</option>
                {data.prodottiGrezzi.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Vincolo varietà
              <select
                name="vincolo_varieta_id"
                defaultValue={row && 'vincolo_varieta_id' in row ? (row.vincolo_varieta_id ?? '') : ''}
                className="rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="">Nessun vincolo</option>
                {data.varieta.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Descrizione
              <input name="descrizione" defaultValue={row && 'descrizione' in row ? (row.descrizione ?? '') : ''} className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm">
              <input
                type="checkbox"
                name="peso_variabile"
                defaultChecked={Boolean(row && 'peso_variabile' in row ? row.peso_variabile : false)}
              />
              Peso variabile
            </label>
          </>
        );
      case 'imballaggi_secondari':
        return (
          <>
            <label className="grid gap-1 text-sm">
              Nome
              <input name="nome" defaultValue={row && 'nome' in row ? row.nome : ''} required className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm">
              Tara (kg)
              <input type="number" step="0.01" name="tara_kg" defaultValue={row && 'tara_kg' in row ? (row.tara_kg ?? '') : ''} className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm">
              Lunghezza (cm)
              <input type="number" step="0.01" name="lunghezza_cm" defaultValue={row && 'lunghezza_cm' in row ? (row.lunghezza_cm ?? '') : ''} className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm">
              Larghezza (cm)
              <input type="number" step="0.01" name="larghezza_cm" defaultValue={row && 'larghezza_cm' in row ? (row.larghezza_cm ?? '') : ''} className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm">
              Altezza (cm)
              <input type="number" step="0.01" name="altezza_cm" defaultValue={row && 'altezza_cm' in row ? (row.altezza_cm ?? '') : ''} className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm md:col-span-2">
              Descrizione
              <input name="descrizione" defaultValue={row && 'descrizione' in row ? (row.descrizione ?? '') : ''} className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
          </>
        );
      case 'linee':
        return (
          <>
            <label className="grid gap-1 text-sm">
              Nome
              <input name="nome" defaultValue={row && 'nome' in row ? row.nome : ''} required className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm">
              Ordine
              <input type="number" name="ordine" defaultValue={row && 'ordine' in row ? (row.ordine ?? '') : ''} className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm md:col-span-2">
              Descrizione
              <input name="descrizione" defaultValue={row && 'descrizione' in row ? (row.descrizione ?? '') : ''} className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
          </>
        );
      case 'sigle_lotto':
        return (
          <>
            <label className="grid gap-1 text-sm">
              Codice
              <input name="codice" defaultValue={row && 'codice' in row ? row.codice : ''} required className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm">
              Produttore
              <input name="produttore" defaultValue={row && 'produttore' in row ? row.produttore : ''} required className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm">
              Prodotto grezzo
              <select
                name="prodotto_grezzo_id"
                defaultValue={row && 'prodotto_grezzo_id' in row ? row.prodotto_grezzo_id : ''}
                required
                className="rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="">Seleziona prodotto</option>
                {data.prodottiGrezzi.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Varietà
              <select
                name="varieta_id"
                defaultValue={row && 'varieta_id' in row ? row.varieta_id : ''}
                required
                className="rounded-md border border-slate-300 px-3 py-2"
              >
                <option value="">Seleziona varietà</option>
                {filteredVarieta.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm md:col-span-2">
              Campo
              <input name="campo" defaultValue={row && 'campo' in row ? (row.campo ?? '') : ''} className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
          </>
        );
    }
  }

  return (
    <section className="space-y-6 px-4 py-6 md:px-6">
      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Anagrafiche</h1>
        <p className="mt-1 text-sm text-slate-600">Interfaccia gestionale con tab, ordinamento colonne, paginazione e CRUD completo.</p>
        {statusMessage ? <p className="mt-3 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">{statusMessage}</p> : null}
      </header>

      <nav className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <ul className="flex min-w-max gap-2">
          {TAB_CONFIG.map((tab) => (
            <li key={tab.key}>
              <button
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 md:px-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{TAB_CONFIG.find((tab) => tab.key === activeTab)?.label}</h2>
            <p className="text-sm text-slate-600">{TAB_CONFIG.find((tab) => tab.key === activeTab)?.description}</p>
          </div>
          <button
            type="button"
            onClick={() => setModalState({ mode: 'create', table: activeTab })}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            + Nuovo record
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {columns.map((column) => {
                  const currentSort = sortState[activeTab];
                  const isSorted = currentSort.key === column.key;
                  const direction = isSorted ? (currentSort.direction === 'asc' ? '↑' : '↓') : '';

                  return (
                    <th key={column.key} className="px-4 py-3 text-left font-semibold text-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          setSortState((current) => {
                            const currentConfig = current[activeTab];
                            const nextDirection: SortDirection =
                              currentConfig.key === column.key && currentConfig.direction === 'asc' ? 'desc' : 'asc';
                            return { ...current, [activeTab]: { key: column.key, direction: nextDirection } };
                          });
                        }}
                        className="inline-flex items-center gap-1"
                      >
                        {column.label} <span className="text-xs text-slate-500">{direction}</span>
                      </button>
                    </th>
                  );
                })}
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-slate-500">
                    Nessun record presente.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id} className={row.is_active ? 'bg-white' : 'bg-slate-50 text-slate-500'}>
                    {columns.map((column) => (
                      <td key={`${row.id}-${column.key}`} className="px-4 py-3">
                        {column.render(row)}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setModalState({ mode: 'edit', table: activeTab, row })}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium"
                        >
                          Modifica
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void toggleRecordActive(activeTab, row);
                          }}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium"
                        >
                          {row.is_active ? 'Disattiva' : 'Ripristina'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600 md:px-5">
          <span>
            Pagina {currentPage} di {totalPages} • {tableRows.length} record
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage(activeTab, currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-md border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Precedente
            </button>
            <button
              type="button"
              onClick={() => setPage(activeTab, currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded-md border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Successiva
            </button>
          </div>
        </footer>
      </article>

      {modalState ? (
        <ModalShell
          title={`${modalState.mode === 'create' ? 'Nuovo' : 'Modifica'} ${TAB_CONFIG.find((item) => item.key === modalState.table)?.label}`}
          onClose={() => setModalState(null)}
        >
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmitModal}>
            {renderFormFields(modalState.table, modalState.mode === 'edit' ? modalState.row : undefined)}
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModalState(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm">
                Annulla
              </button>
              <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                {modalState.mode === 'create' ? 'Crea record' : 'Salva modifiche'}
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </section>
  );
}
