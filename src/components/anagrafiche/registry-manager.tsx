'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

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


function sortByName<T extends { nome: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
}

function sortLinee(rows: LineaRow[]): LineaRow[] {
  return [...rows].sort((a, b) => {
    if (a.ordine === null && b.ordine === null) {
      return a.nome.localeCompare(b.nome, 'it');
    }
    if (a.ordine === null) {
      return 1;
    }
    if (b.ordine === null) {
      return -1;
    }
    return a.ordine - b.ordine;
  });
}

function sortSigle(rows: SiglaLottoRow[]): SiglaLottoRow[] {
  return [...rows].sort((a, b) => a.codice.localeCompare(b.codice, 'it'));
}

function parseNumberOrNull(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  return Number(value);
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
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [userIdentity, setUserIdentity] = useState<{ userId: string; actorName: string } | null>(null);
  const supabase = useMemo(() => createSupabaseClient(), []);

  const prodottoById = useMemo(() => {
    return new Map(data.prodottiGrezzi.map((prodotto) => [prodotto.id, prodotto.nome]));
  }, [data.prodottiGrezzi]);

  const varietaById = useMemo(() => {
    return new Map(data.varieta.map((varieta) => [varieta.id, varieta.nome]));
  }, [data.varieta]);

  function upsertLocalRow(table: RegistryTable, row: Record<string, unknown>) {
    setData((currentData) => {
      switch (table) {
        case 'prodotti_grezzi': {
          const newRow = row as ProdottoGrezzoRow;
          const rows = currentData.prodottiGrezzi.filter((existingRow) => existingRow.id !== newRow.id);
          return { ...currentData, prodottiGrezzi: sortByName([...rows, newRow]) };
        }
        case 'varieta': {
          const newRow = row as VarietaRow;
          const rows = currentData.varieta.filter((existingRow) => existingRow.id !== newRow.id);
          return { ...currentData, varieta: sortByName([...rows, newRow]) };
        }
        case 'articoli': {
          const newRow = row as ArticoloRow;
          const rows = currentData.articoli.filter((existingRow) => existingRow.id !== newRow.id);
          return { ...currentData, articoli: sortByName([...rows, newRow]) };
        }
        case 'imballaggi_secondari': {
          const newRow = row as ImballaggioRow;
          const rows = currentData.imballaggi.filter((existingRow) => existingRow.id !== newRow.id);
          return { ...currentData, imballaggi: sortByName([...rows, newRow]) };
        }
        case 'linee': {
          const newRow = row as LineaRow;
          const rows = currentData.linee.filter((existingRow) => existingRow.id !== newRow.id);
          return { ...currentData, linee: sortLinee([...rows, newRow]) };
        }
        case 'sigle_lotto': {
          const newRow = row as SiglaLottoRow;
          const rows = currentData.sigleLotto.filter((existingRow) => existingRow.id !== newRow.id);
          return { ...currentData, sigleLotto: sortSigle([...rows, newRow]) };
        }
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
    const [
      prodottiResponse,
      varietaResponse,
      articoliResponse,
      imballaggiResponse,
      lineeResponse,
      sigleLottoResponse,
      userResponse
    ] = await Promise.all([
      fetchRegistryTable(supabase, 'prodotti_grezzi', 'nome'),
      fetchRegistryTable(supabase, 'varieta', 'nome'),
      fetchRegistryTable(supabase, 'articoli', 'nome'),
      fetchRegistryTable(supabase, 'imballaggi_secondari', 'nome'),
      fetchRegistryTable(supabase, 'linee', 'ordine'),
      fetchRegistryTable(supabase, 'sigle_lotto', 'codice'),
      fetchCurrentUser(supabase)
    ]);

    const errors = [
      prodottiResponse.error,
      varietaResponse.error,
      articoliResponse.error,
      imballaggiResponse.error,
      lineeResponse.error,
      sigleLottoResponse.error,
      userResponse.error
    ].filter((error) => error !== null);

    if (errors.length > 0) {
      const errorMessages = errors.map((error) => error.message).join('; ');
      console.error('Errore durante il caricamento delle anagrafiche:', errors);
      setStatusMessage(`Errore caricamento anagrafiche: ${errorMessages}`);
      return;
    }

    setData({
      prodottiGrezzi: (prodottiResponse.data ?? []) as ProdottoGrezzoRow[],
      varieta: (varietaResponse.data ?? []) as VarietaRow[],
      articoli: (articoliResponse.data ?? []) as ArticoloRow[],
      imballaggi: (imballaggiResponse.data ?? []) as ImballaggioRow[],
      linee: (lineeResponse.data ?? []) as LineaRow[],
      sigleLotto: (sigleLottoResponse.data ?? []) as SiglaLottoRow[]
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
      return;
    }

    if (table === 'sigle_lotto') {
      const incompatibilityError = validateSiglaLottoPairing(payload);
      if (incompatibilityError) {
        setStatusMessage(incompatibilityError);
        return;
      }
    }

    const response = await createRegistryRow(supabase, table, payload, userIdentity.userId);

    if (response.error || !response.data) {
      setStatusMessage(`Errore creazione ${table}: ${response.error?.message ?? 'sconosciuto'}`);
      return;
    }

    await logAuditEvent({
      tableName: table,
      recordId: response.data.id,
      action: 'insert',
      oldValue: null,
      newValue: response.data
    });

    setStatusMessage(`Record creato in ${table}.`);
    upsertLocalRow(table, response.data);
  }

  async function updateRecord(table: RegistryTable, rowId: string, payload: Record<string, unknown>) {
    if (!userIdentity) {
      setStatusMessage('Utente non disponibile. Ricarica la pagina.');
      return;
    }

    if (table === 'sigle_lotto') {
      const incompatibilityError = validateSiglaLottoPairing(payload);
      if (incompatibilityError) {
        setStatusMessage(incompatibilityError);
        return;
      }
    }

    const existing = await fetchRegistryRowById(supabase, table, rowId);
    if (existing.error || !existing.data) {
      setStatusMessage(`Errore lettura record ${table}: ${existing.error?.message ?? 'sconosciuto'}`);
      return;
    }

    const response = await updateRegistryRow(supabase, table, rowId, payload, userIdentity.userId);

    if (response.error || !response.data) {
      setStatusMessage(`Errore aggiornamento ${table}: ${response.error?.message ?? 'sconosciuto'}`);
      return;
    }

    await logAuditEvent({
      tableName: table,
      recordId: rowId,
      action: 'update',
      oldValue: existing.data,
      newValue: response.data
    });

    setStatusMessage(`Record aggiornato in ${table}.`);
    upsertLocalRow(table, response.data);
  }

  async function softDeleteRecord(table: RegistryTable, rowId: string, shouldRestore: boolean) {
    if (!userIdentity) {
      setStatusMessage('Utente non disponibile. Ricarica la pagina.');
      return;
    }

    const existing = await fetchRegistryRowById(supabase, table, rowId);
    if (existing.error || !existing.data) {
      setStatusMessage(`Errore lettura record ${table}: ${existing.error?.message ?? 'sconosciuto'}`);
      return;
    }

    const response = await setRegistryRowActiveStatus(supabase, table, rowId, shouldRestore, userIdentity.userId);

    if (response.error || !response.data) {
      setStatusMessage(
        `Errore ${shouldRestore ? 'ripristino' : 'disattivazione'} ${table}: ${response.error?.message ?? 'sconosciuto'}`
      );
      return;
    }

    await logAuditEvent({
      tableName: table,
      recordId: rowId,
      action: shouldRestore ? 'restore' : 'soft_delete',
      oldValue: existing.data,
      newValue: response.data
    });

    setStatusMessage(`${shouldRestore ? 'Record ripristinato' : 'Record disattivato'} in ${table}.`);
    upsertLocalRow(table, response.data);
  }

  async function onCreateProdotto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await createRecord('prodotti_grezzi', {
      nome: String(formData.get('nome') ?? ''),
      descrizione: String(formData.get('descrizione') ?? '') || null
    });
    event.currentTarget.reset();
  }

  async function onCreateVarieta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await createRecord('varieta', {
      nome: String(formData.get('nome') ?? ''),
      descrizione: String(formData.get('descrizione') ?? '') || null,
      prodotto_grezzo_id: String(formData.get('prodotto_grezzo_id') ?? '')
    });
    event.currentTarget.reset();
  }

  async function onCreateArticolo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await createRecord('articoli', {
      nome: String(formData.get('nome') ?? ''),
      descrizione: String(formData.get('descrizione') ?? '') || null,
      peso_per_collo: Number(formData.get('peso_per_collo') ?? 0),
      peso_variabile: formData.get('peso_variabile') === 'on',
      vincolo_prodotto_grezzo_id: String(formData.get('vincolo_prodotto_grezzo_id') ?? '') || null,
      vincolo_varieta_id: String(formData.get('vincolo_varieta_id') ?? '') || null
    });
    event.currentTarget.reset();
  }

  async function onCreateImballaggio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await createRecord('imballaggi_secondari', {
      nome: String(formData.get('nome') ?? ''),
      descrizione: String(formData.get('descrizione') ?? '') || null,
      tara_kg: parseNumberOrNull(String(formData.get('tara_kg') ?? '')),
      lunghezza_cm: parseNumberOrNull(String(formData.get('lunghezza_cm') ?? '')),
      larghezza_cm: parseNumberOrNull(String(formData.get('larghezza_cm') ?? '')),
      altezza_cm: parseNumberOrNull(String(formData.get('altezza_cm') ?? ''))
    });
    event.currentTarget.reset();
  }

  async function onCreateLinea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await createRecord('linee', {
      nome: String(formData.get('nome') ?? ''),
      descrizione: String(formData.get('descrizione') ?? '') || null,
      ordine: parseNumberOrNull(String(formData.get('ordine') ?? ''))
    });
    event.currentTarget.reset();
  }

  async function onCreateSigla(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await createRecord('sigle_lotto', {
      codice: String(formData.get('codice') ?? ''),
      produttore: String(formData.get('produttore') ?? ''),
      prodotto_grezzo_id: String(formData.get('prodotto_grezzo_id') ?? ''),
      varieta_id: String(formData.get('varieta_id') ?? ''),
      campo: String(formData.get('campo') ?? '') || null
    });
    event.currentTarget.reset();
  }

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Anagrafiche</h1>
        <p className="text-sm text-secondary">
          Gestione completa CRUD con audit log e soft delete su tutte le entità anagrafiche.
        </p>
        {statusMessage && <p className="mt-2 rounded border border-slate-200 bg-white p-2 text-sm">{statusMessage}</p>}
      </div>

      <article className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-medium">Schema relazionale (vista rapida)</h2>
        <p className="mt-2 text-sm text-secondary">
          prodotti_grezzi 1→N varietà, prodotti_grezzi/varietà 1→N sigle_lotto, e articoli con vincoli opzionali su
          prodotto grezzo e varietà.
        </p>
        <pre className="mt-3 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
{`registry.prodotti_grezzi
  ├── registry.varieta (prodotto_grezzo_id)
  │     └── registry.sigle_lotto (varieta_id)
  ├── registry.sigle_lotto (prodotto_grezzo_id)
  └── registry.articoli (vincolo_prodotto_grezzo_id)
        └── registry.articoli (vincolo_varieta_id)

registry.linee
registry.imballaggi_secondari`}
        </pre>
      </article>

      <article className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-medium">Prodotti grezzi</h2>
        <form className="grid gap-2 md:grid-cols-3" onSubmit={onCreateProdotto}>
          <input name="nome" required placeholder="Nome" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input name="descrizione" placeholder="Descrizione" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded bg-primary px-4 py-2 text-sm text-white">Aggiungi</button>
        </form>
        <div className="space-y-2">
          {data.prodottiGrezzi.map((row) => (
            <form key={row.id} className="grid gap-2 rounded border border-slate-200 p-2 md:grid-cols-4" onSubmit={async (event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              await updateRecord('prodotti_grezzi', row.id, {
                nome: String(formData.get('nome') ?? ''),
                descrizione: String(formData.get('descrizione') ?? '') || null
              });
            }}>
              <input name="nome" defaultValue={row.nome} className="rounded border border-slate-300 px-3 py-2 text-sm" />
              <input name="descrizione" defaultValue={row.descrizione ?? ''} className="rounded border border-slate-300 px-3 py-2 text-sm" />
              <div className="flex items-center gap-2">
                <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-xs text-white">Salva</button>
                <button type="button" onClick={() => softDeleteRecord('prodotti_grezzi', row.id, row.is_active === false)} className="rounded border border-slate-300 px-3 py-2 text-xs">{row.is_active === false ? 'Ripristina' : 'Disattiva'}</button>
              </div>
              <p className="text-xs text-secondary">{row.is_active === false ? 'Disattivato' : 'Attivo'}</p>
            </form>
          ))}
        </div>
      </article>

      <article className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-medium">Varietà</h2>
        <form className="grid gap-2 md:grid-cols-4" onSubmit={onCreateVarieta}>
          <input name="nome" required placeholder="Nome" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <select name="prodotto_grezzo_id" required className="rounded border border-slate-300 px-3 py-2 text-sm"><option value="">Prodotto grezzo</option>{data.prodottiGrezzi.map((prodotto) => (<option key={prodotto.id} value={prodotto.id}>{prodotto.nome}</option>))}</select>
          <input name="descrizione" placeholder="Descrizione" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded bg-primary px-4 py-2 text-sm text-white">Aggiungi</button>
        </form>
        <div className="space-y-2">
          {data.varieta.map((row) => (
            <form key={row.id} className="grid gap-2 rounded border border-slate-200 p-2 md:grid-cols-5" onSubmit={async (event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              await updateRecord('varieta', row.id, {
                nome: String(formData.get('nome') ?? ''),
                descrizione: String(formData.get('descrizione') ?? '') || null,
                prodotto_grezzo_id: String(formData.get('prodotto_grezzo_id') ?? '')
              });
            }}>
              <input name="nome" defaultValue={row.nome} className="rounded border border-slate-300 px-3 py-2 text-sm" />
              <select name="prodotto_grezzo_id" defaultValue={row.prodotto_grezzo_id} className="rounded border border-slate-300 px-3 py-2 text-sm">{data.prodottiGrezzi.map((prodotto) => (<option key={prodotto.id} value={prodotto.id}>{prodotto.nome}</option>))}</select>
              <input name="descrizione" defaultValue={row.descrizione ?? ''} className="rounded border border-slate-300 px-3 py-2 text-sm" />
              <div className="flex items-center gap-2">
                <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-xs text-white">Salva</button>
                <button type="button" onClick={() => softDeleteRecord('varieta', row.id, row.is_active === false)} className="rounded border border-slate-300 px-3 py-2 text-xs">{row.is_active === false ? 'Ripristina' : 'Disattiva'}</button>
              </div>
              <p className="text-xs text-secondary">{row.is_active === false ? 'Disattivato' : 'Attivo'}</p>
            </form>
          ))}
        </div>
      </article>

      <article className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-medium">Articoli</h2>
        <form className="grid gap-2 md:grid-cols-3" onSubmit={onCreateArticolo}>
          <input name="nome" required placeholder="Nome" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input name="peso_per_collo" type="number" step="0.01" min="0" required placeholder="Peso per collo" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <label className="flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm"><input type="checkbox" name="peso_variabile" /> Peso variabile</label>
          <select name="vincolo_prodotto_grezzo_id" className="rounded border border-slate-300 px-3 py-2 text-sm"><option value="">Nessun vincolo prodotto</option>{data.prodottiGrezzi.map((prodotto) => (<option key={prodotto.id} value={prodotto.id}>{prodotto.nome}</option>))}</select>
          <select name="vincolo_varieta_id" className="rounded border border-slate-300 px-3 py-2 text-sm"><option value="">Nessun vincolo varietà</option>{data.varieta.map((varieta) => (<option key={varieta.id} value={varieta.id}>{varieta.nome}</option>))}</select>
          <input name="descrizione" placeholder="Descrizione" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded bg-primary px-4 py-2 text-sm text-white md:col-span-3">Aggiungi</button>
        </form>
        <div className="space-y-2">
          {data.articoli.map((row) => (
            <form key={row.id} className="grid gap-2 rounded border border-slate-200 p-2 md:grid-cols-6" onSubmit={async (event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              await updateRecord('articoli', row.id, {
                nome: String(formData.get('nome') ?? ''),
                descrizione: String(formData.get('descrizione') ?? '') || null,
                peso_per_collo: Number(formData.get('peso_per_collo') ?? 0),
                peso_variabile: formData.get('peso_variabile') === 'on',
                vincolo_prodotto_grezzo_id: String(formData.get('vincolo_prodotto_grezzo_id') ?? '') || null,
                vincolo_varieta_id: String(formData.get('vincolo_varieta_id') ?? '') || null
              });
            }}>
              <input name="nome" defaultValue={row.nome} className="rounded border border-slate-300 px-3 py-2 text-sm" />
              <input name="peso_per_collo" type="number" step="0.01" min="0" defaultValue={row.peso_per_collo} className="rounded border border-slate-300 px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm"><input type="checkbox" name="peso_variabile" defaultChecked={row.peso_variabile} /> Variabile</label>
              <select name="vincolo_prodotto_grezzo_id" defaultValue={row.vincolo_prodotto_grezzo_id ?? ''} className="rounded border border-slate-300 px-3 py-2 text-sm"><option value="">Nessun vincolo prodotto</option>{data.prodottiGrezzi.map((prodotto) => (<option key={prodotto.id} value={prodotto.id}>{prodotto.nome}</option>))}</select>
              <select name="vincolo_varieta_id" defaultValue={row.vincolo_varieta_id ?? ''} className="rounded border border-slate-300 px-3 py-2 text-sm"><option value="">Nessun vincolo varietà</option>{data.varieta.map((varieta) => (<option key={varieta.id} value={varieta.id}>{varieta.nome}</option>))}</select>
              <input name="descrizione" defaultValue={row.descrizione ?? ''} className="rounded border border-slate-300 px-3 py-2 text-sm" />
              <div className="flex items-center gap-2 md:col-span-6">
                <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-xs text-white">Salva</button>
                <button type="button" onClick={() => softDeleteRecord('articoli', row.id, row.is_active === false)} className="rounded border border-slate-300 px-3 py-2 text-xs">{row.is_active === false ? 'Ripristina' : 'Disattiva'}</button>
                <span className="text-xs text-secondary">{row.is_active === false ? 'Disattivato' : 'Attivo'}</span>
              </div>
            </form>
          ))}
        </div>
      </article>

      <article className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-medium">Imballaggi secondari</h2>
        <form className="grid gap-2 md:grid-cols-3" onSubmit={onCreateImballaggio}>
          <input name="nome" required placeholder="Nome" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input name="descrizione" placeholder="Descrizione" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input name="tara_kg" type="number" step="0.01" placeholder="Tara kg" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input name="lunghezza_cm" type="number" step="0.01" placeholder="Lunghezza cm" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input name="larghezza_cm" type="number" step="0.01" placeholder="Larghezza cm" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input name="altezza_cm" type="number" step="0.01" placeholder="Altezza cm" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded bg-primary px-4 py-2 text-sm text-white md:col-span-3">Aggiungi</button>
        </form>
        <div className="space-y-2">
          {data.imballaggi.map((row) => (
            <form key={row.id} className="grid gap-2 rounded border border-slate-200 p-2 md:grid-cols-7" onSubmit={async (event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              await updateRecord('imballaggi_secondari', row.id, {
                nome: String(formData.get('nome') ?? ''),
                descrizione: String(formData.get('descrizione') ?? '') || null,
                tara_kg: parseNumberOrNull(String(formData.get('tara_kg') ?? '')),
                lunghezza_cm: parseNumberOrNull(String(formData.get('lunghezza_cm') ?? '')),
                larghezza_cm: parseNumberOrNull(String(formData.get('larghezza_cm') ?? '')),
                altezza_cm: parseNumberOrNull(String(formData.get('altezza_cm') ?? ''))
              });
            }}>
              <input name="nome" defaultValue={row.nome} className="rounded border border-slate-300 px-3 py-2 text-sm" />
              <input name="descrizione" defaultValue={row.descrizione ?? ''} className="rounded border border-slate-300 px-3 py-2 text-sm" />
              <input name="tara_kg" type="number" step="0.01" defaultValue={row.tara_kg ?? ''} className="rounded border border-slate-300 px-3 py-2 text-sm" />
              <input name="lunghezza_cm" type="number" step="0.01" defaultValue={row.lunghezza_cm ?? ''} className="rounded border border-slate-300 px-3 py-2 text-sm" />
              <input name="larghezza_cm" type="number" step="0.01" defaultValue={row.larghezza_cm ?? ''} className="rounded border border-slate-300 px-3 py-2 text-sm" />
              <input name="altezza_cm" type="number" step="0.01" defaultValue={row.altezza_cm ?? ''} className="rounded border border-slate-300 px-3 py-2 text-sm" />
              <div className="flex items-center gap-2">
                <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-xs text-white">Salva</button>
                <button type="button" onClick={() => softDeleteRecord('imballaggi_secondari', row.id, row.is_active === false)} className="rounded border border-slate-300 px-3 py-2 text-xs">{row.is_active === false ? 'Ripristina' : 'Disattiva'}</button>
              </div>
            </form>
          ))}
        </div>
      </article>

      <article className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-medium">Linee</h2>
        <form className="grid gap-2 md:grid-cols-4" onSubmit={onCreateLinea}>
          <input name="nome" required placeholder="Nome" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input name="ordine" type="number" placeholder="Ordine" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input name="descrizione" placeholder="Descrizione" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded bg-primary px-4 py-2 text-sm text-white">Aggiungi</button>
        </form>
        <div className="space-y-2">
          {data.linee.map((row) => (
            <form key={row.id} className="grid gap-2 rounded border border-slate-200 p-2 md:grid-cols-5" onSubmit={async (event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              await updateRecord('linee', row.id, {
                nome: String(formData.get('nome') ?? ''),
                ordine: parseNumberOrNull(String(formData.get('ordine') ?? '')),
                descrizione: String(formData.get('descrizione') ?? '') || null
              });
            }}>
              <input name="nome" defaultValue={row.nome} className="rounded border border-slate-300 px-3 py-2 text-sm" />
              <input name="ordine" type="number" defaultValue={row.ordine ?? ''} className="rounded border border-slate-300 px-3 py-2 text-sm" />
              <input name="descrizione" defaultValue={row.descrizione ?? ''} className="rounded border border-slate-300 px-3 py-2 text-sm" />
              <div className="flex items-center gap-2">
                <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-xs text-white">Salva</button>
                <button type="button" onClick={() => softDeleteRecord('linee', row.id, row.is_active === false)} className="rounded border border-slate-300 px-3 py-2 text-xs">{row.is_active === false ? 'Ripristina' : 'Disattiva'}</button>
              </div>
              <p className="text-xs text-secondary">{row.is_active === false ? 'Disattivato' : 'Attivo'}</p>
            </form>
          ))}
        </div>
      </article>

      <article className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-medium">Sigle lotto</h2>
        <form className="grid gap-2 md:grid-cols-5" onSubmit={onCreateSigla}>
          <input name="codice" required placeholder="Codice" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input name="produttore" required placeholder="Produttore" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <select name="prodotto_grezzo_id" required className="rounded border border-slate-300 px-3 py-2 text-sm"><option value="">Prodotto grezzo</option>{data.prodottiGrezzi.map((prodotto) => (<option key={prodotto.id} value={prodotto.id}>{prodotto.nome}</option>))}</select>
          <select name="varieta_id" required className="rounded border border-slate-300 px-3 py-2 text-sm"><option value="">Varietà</option>{data.varieta.map((varieta) => (<option key={varieta.id} value={varieta.id}>{varieta.nome}</option>))}</select>
          <input name="campo" placeholder="Campo" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded bg-primary px-4 py-2 text-sm text-white md:col-span-5">Aggiungi</button>
        </form>
        <div className="space-y-2">
          {data.sigleLotto.map((row) => (
            <form key={row.id} className="grid gap-2 rounded border border-slate-200 p-2 md:grid-cols-7" onSubmit={async (event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              await updateRecord('sigle_lotto', row.id, {
                codice: String(formData.get('codice') ?? ''),
                produttore: String(formData.get('produttore') ?? ''),
                prodotto_grezzo_id: String(formData.get('prodotto_grezzo_id') ?? ''),
                varieta_id: String(formData.get('varieta_id') ?? ''),
                campo: String(formData.get('campo') ?? '') || null
              });
            }}>
              <input name="codice" defaultValue={row.codice} className="rounded border border-slate-300 px-3 py-2 text-sm" />
              <input name="produttore" defaultValue={row.produttore} className="rounded border border-slate-300 px-3 py-2 text-sm" />
              <select name="prodotto_grezzo_id" defaultValue={row.prodotto_grezzo_id} className="rounded border border-slate-300 px-3 py-2 text-sm">{data.prodottiGrezzi.map((prodotto) => (<option key={prodotto.id} value={prodotto.id}>{prodotto.nome}</option>))}</select>
              <select name="varieta_id" defaultValue={row.varieta_id} className="rounded border border-slate-300 px-3 py-2 text-sm">{data.varieta.map((varieta) => (<option key={varieta.id} value={varieta.id}>{varieta.nome}</option>))}</select>
              <input name="campo" defaultValue={row.campo ?? ''} className="rounded border border-slate-300 px-3 py-2 text-sm" />
              <div className="col-span-2 flex items-center gap-2">
                <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-xs text-white">Salva</button>
                <button type="button" onClick={() => softDeleteRecord('sigle_lotto', row.id, row.is_active === false)} className="rounded border border-slate-300 px-3 py-2 text-xs">{row.is_active === false ? 'Ripristina' : 'Disattiva'}</button>
                <span className="text-xs text-secondary">{prodottoById.get(row.prodotto_grezzo_id)} / {varietaById.get(row.varieta_id)}</span>
              </div>
            </form>
          ))}
        </div>
      </article>
    </section>
  );
}
