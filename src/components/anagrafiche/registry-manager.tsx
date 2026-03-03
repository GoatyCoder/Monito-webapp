'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { AUDIT_SCHEMA, REGISTRY_SCHEMA } from '@/lib/config/db';
import { createSupabaseClient } from '@/lib/db/supabase-client';

type RegistryTable =
  | 'prodotti_grezzi'
  | 'varieta'
  | 'articoli'
  | 'imballaggi_secondari'
  | 'linee'
  | 'sigle_lotto';

type ActorInfo = {
  id: string;
  name: string;
};

type BaseRegistryRecord = {
  id: string;
  nome?: string;
  codice?: string;
  descrizione?: string | null;
  is_active?: boolean;
  created_at: string;
};

type ProdottoGrezzoRecord = BaseRegistryRecord & { nome: string };
type VarietaRecord = BaseRegistryRecord & { nome: string; prodotto_grezzo_id: string };
type ArticoloRecord = BaseRegistryRecord & {
  nome: string;
  peso_per_collo: number;
  peso_variabile: boolean;
  vincolo_prodotto_grezzo_id: string | null;
  vincolo_varieta_id: string | null;
};
type ImballaggioSecondarioRecord = BaseRegistryRecord & {
  nome: string;
  tara_kg: number | null;
  lunghezza_cm: number | null;
  larghezza_cm: number | null;
  altezza_cm: number | null;
};
type LineaRecord = BaseRegistryRecord & { nome: string; ordine: number | null };
type SiglaLottoRecord = BaseRegistryRecord & {
  codice: string;
  produttore: string;
  prodotto_grezzo_id: string;
  varieta_id: string;
  campo: string | null;
};

type RegistryRecord =
  | ProdottoGrezzoRecord
  | VarietaRecord
  | ArticoloRecord
  | ImballaggioSecondarioRecord
  | LineaRecord
  | SiglaLottoRecord;

const ENTITY_CONFIG: { table: RegistryTable; label: string; select: string }[] = [
  { table: 'prodotti_grezzi', label: 'Prodotti grezzi', select: 'id,nome,descrizione,is_active,created_at' },
  { table: 'varieta', label: 'Varietà', select: 'id,nome,descrizione,prodotto_grezzo_id,is_active,created_at' },
  {
    table: 'articoli',
    label: 'Articoli',
    select:
      'id,nome,descrizione,peso_per_collo,peso_variabile,vincolo_prodotto_grezzo_id,vincolo_varieta_id,is_active,created_at'
  },
  {
    table: 'imballaggi_secondari',
    label: 'Imballaggi secondari',
    select: 'id,nome,descrizione,tara_kg,lunghezza_cm,larghezza_cm,altezza_cm,is_active,created_at'
  },
  { table: 'linee', label: 'Linee', select: 'id,nome,descrizione,ordine,is_active,created_at' },
  {
    table: 'sigle_lotto',
    label: 'Sigle lotto',
    select: 'id,codice,produttore,prodotto_grezzo_id,varieta_id,campo,is_active,created_at'
  }
];

export function RegistryManager() {
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [actor, setActor] = useState<ActorInfo | null>(null);
  const [activeTable, setActiveTable] = useState<RegistryTable>('prodotti_grezzi');
  const [records, setRecords] = useState<Record<RegistryTable, RegistryRecord[]>>({
    prodotti_grezzi: [],
    varieta: [],
    articoli: [],
    imballaggi_secondari: [],
    linee: [],
    sigle_lotto: []
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadActor = useCallback(async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setError('Utente non autenticato.');
      return;
    }

    const metadataName =
      typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : user.email ?? 'Utente Monito';
    setActor({ id: user.id, name: metadataName });
  }, [supabase]);

  const loadTable = useCallback(
    async (table: RegistryTable) => {
      const config = ENTITY_CONFIG.find((item) => item.table === table);
      if (!config) {
        return;
      }

      const { data, error: queryError } = await supabase
        .schema(REGISTRY_SCHEMA)
        .from(table)
        .select(config.select)
        .order('created_at', { ascending: false });

      if (queryError) {
        setError(queryError.message);
        return;
      }

      setRecords((prev) => ({ ...prev, [table]: (data ?? []) as unknown as RegistryRecord[] }));
    },
    [supabase]
  );

  const loadAllTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all(ENTITY_CONFIG.map((item) => loadTable(item.table)));
    setLoading(false);
  }, [loadTable]);

  useEffect(() => {
    void loadActor();
    void loadAllTables();
  }, [loadActor, loadAllTables]);

  const activeRecords = records[activeTable] ?? [];

  const logAuditEvent = useCallback(
    async (params: {
      action: 'insert' | 'update' | 'soft_delete' | 'restore';
      tableName: RegistryTable;
      recordId: string;
      oldValue: Record<string, unknown> | null;
      newValue: Record<string, unknown> | null;
    }) => {
      if (!actor) {
        return;
      }

      const { error: rpcError } = await supabase.rpc('log_audit_event', {
        actor_id: actor.id,
        actor_name: actor.name,
        schema_name: REGISTRY_SCHEMA,
        table_name: params.tableName,
        record_id: params.recordId,
        action: params.action,
        old_value: params.oldValue,
        new_value: params.newValue,
        reason: null
      });

      if (rpcError) {
        setError(`Audit log non registrato: ${rpcError.message}`);
      }
    },
    [actor, supabase]
  );

  const resetForm = () => {
    setFormValues({});
    setEditingId(null);
  };

  const buildPayload = (): Record<string, unknown> => {
    const basePayload: Record<string, unknown> = {};

    Object.entries(formValues).forEach(([key, value]) => {
      if (value === '') {
        basePayload[key] = null;
      } else if (['peso_per_collo', 'tara_kg', 'lunghezza_cm', 'larghezza_cm', 'altezza_cm'].includes(key)) {
        basePayload[key] = Number(value);
      } else if (key === 'ordine') {
        basePayload[key] = value ? Number(value) : null;
      } else if (key === 'peso_variabile') {
        basePayload[key] = value === 'true';
      } else {
        basePayload[key] = value;
      }
    });

    return basePayload;
  };

  const handleSave = async () => {
    if (!actor) {
      setError('Utente non disponibile.');
      return;
    }

    setError(null);
    const payload = buildPayload();

    if (editingId) {
      const oldRecord = activeRecords.find((row) => row.id === editingId);
      const { data, error: updateError } = await supabase
        .schema(REGISTRY_SCHEMA)
        .from(activeTable)
        .update({ ...payload, updated_at: new Date().toISOString(), updated_by: actor.id })
        .eq('id', editingId)
        .select()
        .single();

      if (updateError) {
        setError(updateError.message);
        return;
      }

      await logAuditEvent({
        action: 'update',
        tableName: activeTable,
        recordId: editingId,
        oldValue: (oldRecord as Record<string, unknown>) ?? null,
        newValue: (data as Record<string, unknown>) ?? null
      });
    } else {
      const { data, error: insertError } = await supabase
        .schema(REGISTRY_SCHEMA)
        .from(activeTable)
        .insert({ ...payload, created_by: actor.id })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      await logAuditEvent({
        action: 'insert',
        tableName: activeTable,
        recordId: String(data.id),
        oldValue: null,
        newValue: (data as Record<string, unknown>) ?? null
      });
    }

    resetForm();
    await loadTable(activeTable);
  };

  const handleSoftDelete = async (row: RegistryRecord) => {
    if (!actor) {
      return;
    }

    const { data, error: updateError } = await supabase
      .schema(REGISTRY_SCHEMA)
      .from(activeTable)
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        deleted_by: actor.id,
        updated_at: new Date().toISOString(),
        updated_by: actor.id
      })
      .eq('id', row.id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await logAuditEvent({
      action: 'soft_delete',
      tableName: activeTable,
      recordId: row.id,
      oldValue: row as Record<string, unknown>,
      newValue: (data as Record<string, unknown>) ?? null
    });

    await loadTable(activeTable);
  };

  const handleRestore = async (row: RegistryRecord) => {
    if (!actor) {
      return;
    }

    const { data, error: updateError } = await supabase
      .schema(REGISTRY_SCHEMA)
      .from(activeTable)
      .update({
        is_active: true,
        deleted_at: null,
        deleted_by: null,
        updated_at: new Date().toISOString(),
        updated_by: actor.id
      })
      .eq('id', row.id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await logAuditEvent({
      action: 'restore',
      tableName: activeTable,
      recordId: row.id,
      oldValue: row as Record<string, unknown>,
      newValue: (data as Record<string, unknown>) ?? null
    });

    await loadTable(activeTable);
  };

  const editRow = (row: RegistryRecord) => {
    setEditingId(row.id);
    const normalized: Record<string, string> = {};
    Object.entries(row).forEach(([key, value]) => {
      normalized[key] = value === null || value === undefined ? '' : String(value);
    });
    setFormValues(normalized);
  };

  const fieldsForActiveTable = useMemo(() => {
    switch (activeTable) {
      case 'prodotti_grezzi':
        return ['nome', 'descrizione'];
      case 'varieta':
        return ['nome', 'descrizione', 'prodotto_grezzo_id'];
      case 'articoli':
        return ['nome', 'descrizione', 'peso_per_collo', 'peso_variabile', 'vincolo_prodotto_grezzo_id', 'vincolo_varieta_id'];
      case 'imballaggi_secondari':
        return ['nome', 'descrizione', 'tara_kg', 'lunghezza_cm', 'larghezza_cm', 'altezza_cm'];
      case 'linee':
        return ['nome', 'descrizione', 'ordine'];
      case 'sigle_lotto':
        return ['codice', 'produttore', 'prodotto_grezzo_id', 'varieta_id', 'campo'];
      default:
        return [];
    }
  }, [activeTable]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Gestione anagrafiche</h1>
        <p className="text-sm text-secondary">CRUD completo delle entità su schema {REGISTRY_SCHEMA}.</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Schema anagrafiche</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ENTITY_CONFIG.map((entity) => (
            <div key={entity.table} className="rounded border border-slate-200 p-3">
              <p className="font-medium">{entity.label}</p>
              <p className="mt-1 text-xs text-secondary">{REGISTRY_SCHEMA}.{entity.table}</p>
              <p className="mt-2 text-xs text-slate-500">Campi: {entity.select}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {ENTITY_CONFIG.map((entity) => (
          <button
            key={entity.table}
            onClick={() => {
              setActiveTable(entity.table);
              resetForm();
            }}
            className={`rounded px-3 py-2 text-sm ${activeTable === entity.table ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            {entity.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 font-semibold">{editingId ? 'Modifica record' : 'Nuovo record'}</h3>
          <div className="space-y-3">
            {fieldsForActiveTable.map((field) => (
              <label key={field} className="flex flex-col gap-1 text-sm">
                <span className="font-medium">{field}</span>
                {field === 'peso_variabile' ? (
                  <select
                    className="rounded border border-slate-300 px-3 py-2"
                    value={formValues[field] ?? 'false'}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, [field]: event.target.value }))}
                  >
                    <option value="false">false</option>
                    <option value="true">true</option>
                  </select>
                ) : (
                  <input
                    className="rounded border border-slate-300 px-3 py-2"
                    value={formValues[field] ?? ''}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, [field]: event.target.value }))}
                  />
                )}
              </label>
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={() => void handleSave()} className="rounded bg-primary px-3 py-2 text-sm text-white">
                {editingId ? 'Salva modifica' : 'Aggiungi'}
              </button>
              <button onClick={resetForm} className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700">
                Annulla
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Elenco {activeTable}</h3>
            <button onClick={() => void loadTable(activeTable)} className="rounded bg-slate-100 px-3 py-1 text-sm">
              Aggiorna
            </button>
          </div>

          {loading ? <p className="text-sm text-secondary">Caricamento...</p> : null}
          {error ? <p className="mb-2 text-sm text-red-600">{error}</p> : null}

          <div className="space-y-2">
            {activeRecords.map((row) => (
              <div key={row.id} className="rounded border border-slate-200 p-3">
                <p className="text-sm font-medium">{row.nome ?? row.codice}</p>
                <p className="text-xs text-secondary">ID: {row.id}</p>
                <p className="text-xs text-secondary">Stato: {row.is_active === false ? 'Disattivo' : 'Attivo'}</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => editRow(row)} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    Modifica
                  </button>
                  {row.is_active === false ? (
                    <button onClick={() => void handleRestore(row)} className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
                      Ripristina
                    </button>
                  ) : (
                    <button onClick={() => void handleSoftDelete(row)} className="rounded bg-red-100 px-2 py-1 text-xs text-red-700">
                      Disattiva
                    </button>
                  )}
                </div>
              </div>
            ))}
            {activeRecords.length === 0 ? <p className="text-sm text-secondary">Nessun record presente.</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
