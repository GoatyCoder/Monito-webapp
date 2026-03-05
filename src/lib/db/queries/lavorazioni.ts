import { type SupabaseClient } from '@supabase/supabase-js';

import { OPS_SCHEMA, REGISTRY_SCHEMA } from '@/lib/config/db';
import type {
  Articolo,
  ImballaggioSecondario as Imballaggio,
  Lavorazione,
  Linea,
  SiglaLotto
} from '@/types/domain';

type SiglaLottoWithJoin = SiglaLotto & {
  prodottoGrezzo: { id: string; nome: string };
  varieta: { id: string; nome: string };
};

export type WorkOrderFormData = {
  linee: Linea[];
  sigleLotto: SiglaLottoWithJoin[];
  articoli: Articolo[];
  imballaggi: Imballaggio[];
  lavorazioniInCorso: Pick<Lavorazione, 'id' | 'lineaId'>[];
};

export type CreateLavorazionePayload = {
  lineaId: string;
  siglaLottoId: string;
  dataIngresso: string;
  lottoIngresso: number;
  articoloId: string;
  imballaggioSecondarioId: string;
  pesoPerCollo: number;
  note: string | null;
  apertaAt: string | null;
  apertaDa: string | null;
};

export type DashboardLavorazioneItem = {
  id: string;
  lineaId: string;
  lineaNome: string;
  stato: 'programmata' | 'in_corso' | 'terminata';
  apertaAt: string | null;
  chiusaAt: string | null;
  lottoLabel: string;
  articoloNome: string;
  imballaggioNome: string;
  note: string | null;
  pedaneCount: number;
  colliTotali: number;
  pesoTotaleKg: number;
};

export type DashboardSummary = {
  lineeAttive: number;
  lavorazioniAperte: number;
  pedaneOggi: number;
  colliOggi: number;
  scartoOggiKg: number;
};

export type DashboardData = {
  summary: DashboardSummary;
  linee: Array<{
    id: string;
    nome: string;
    lavorazioni: DashboardLavorazioneItem[];
  }>;
  recenti: DashboardLavorazioneItem[];
};

export class LavorazioniQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LavorazioniQueryError';
  }
}

export async function fetchNewWorkOrderFormData(supabase: SupabaseClient): Promise<WorkOrderFormData> {
  const [lineeResponse, sigleResponse, articoliResponse, imballaggiResponse, lavorazioniResponse] = await Promise.all([
    supabase.schema(REGISTRY_SCHEMA).from('linee').select('*').eq('is_active', true).order('ordine', { ascending: true }),
    supabase
      .schema(REGISTRY_SCHEMA)
      .from('sigle_lotto')
      .select('*, prodotto_grezzo:prodotti_grezzi(id, nome), varieta:varieta(id, nome)')
      .eq('is_active', true)
      .order('codice', { ascending: true }),
    supabase.schema(REGISTRY_SCHEMA).from('articoli').select('*').eq('is_active', true).order('nome', { ascending: true }),
    supabase
      .schema(REGISTRY_SCHEMA)
      .from('imballaggi_secondari')
      .select('*')
      .eq('is_active', true)
      .order('nome', { ascending: true }),
    supabase
      .schema(OPS_SCHEMA)
      .from('lavorazioni')
      .select('id, linea_id')
      .not('aperta_at', 'is', null)
      .is('chiusa_at', null)
  ]);

  const firstError = [
    lineeResponse.error,
    sigleResponse.error,
    articoliResponse.error,
    imballaggiResponse.error,
    lavorazioniResponse.error
  ].find((error) => Boolean(error));

  if (firstError) {
    throw new LavorazioniQueryError(firstError.message);
  }

  const sigleLotto = (sigleResponse.data ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    codice: row.codice,
    produttore: row.produttore,
    prodottoGrezzoId: row.prodotto_grezzo_id,
    varietaId: row.varieta_id,
    campo: row.campo,
    prodottoGrezzo: {
      id: row.prodotto_grezzo?.id ?? '',
      nome: row.prodotto_grezzo?.nome ?? '—'
    },
    varieta: {
      id: row.varieta?.id ?? '',
      nome: row.varieta?.nome ?? '—'
    }
  }));

  return {
    linee: (lineeResponse.data ?? []).map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      isActive: row.is_active,
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
      nome: row.nome,
      descrizione: row.descrizione,
      ordine: row.ordine
    })),
    sigleLotto,
    articoli: (articoliResponse.data ?? []).map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      isActive: row.is_active,
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
      nome: row.nome,
      descrizione: row.descrizione,
      pesoPerCollo: row.peso_per_collo,
      pesoVariabile: row.peso_variabile,
      vincoloProdottoGrezzoId: row.vincolo_prodotto_grezzo_id,
      vincoloVarietaId: row.vincolo_varieta_id
    })),
    imballaggi: (imballaggiResponse.data ?? []).map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      isActive: row.is_active,
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
      nome: row.nome,
      descrizione: row.descrizione,
      taraKg: row.tara_kg,
      lunghezzaCm: row.lunghezza_cm,
      larghezzaCm: row.larghezza_cm,
      altezzaCm: row.altezza_cm
    })),
    lavorazioniInCorso: (lavorazioniResponse.data ?? []).map((row) => ({
      id: row.id,
      lineaId: row.linea_id
    }))
  };
}

export async function fetchDashboardData(supabase: SupabaseClient): Promise<DashboardData> {
  const today = new Date().toISOString().slice(0, 10);

  const [lineeResponse, lavorazioniResponse, pedaneAllResponse, pedaneOggiResponse, scartiResponse] = await Promise.all([
    supabase.schema(REGISTRY_SCHEMA).from('linee').select('id, nome, ordine').eq('is_active', true).order('ordine'),
    supabase
      .schema(OPS_SCHEMA)
      .from('lavorazioni')
      .select(
        'id, linea_id, sigla_lotto_id, articolo_id, imballaggio_secondario_id, aperta_at, chiusa_at, data_ingresso, lotto_ingresso, note'
      )
      .order('created_at', { ascending: false })
      .limit(120),
    supabase.schema(OPS_SCHEMA).from('pedane').select('lavorazione_id, numero_colli, peso_totale'),
    supabase
      .schema(OPS_SCHEMA)
      .from('pedane')
      .select('id, numero_colli')
      .gte('registrata_at', `${today}T00:00:00`)
      .lte('registrata_at', `${today}T23:59:59`),
    supabase
      .schema(OPS_SCHEMA)
      .from('scarti')
      .select('peso_kg')
      .gte('registrato_at', `${today}T00:00:00`)
      .lte('registrato_at', `${today}T23:59:59`)
  ]);

  const firstError = [
    lineeResponse.error,
    lavorazioniResponse.error,
    pedaneAllResponse.error,
    pedaneOggiResponse.error,
    scartiResponse.error
  ].find((error) => Boolean(error));

  if (firstError) {
    throw new LavorazioniQueryError(firstError.message);
  }

  const [sigleResponse, articoliResponse, imballaggiResponse] = await Promise.all([
    supabase.schema(REGISTRY_SCHEMA).from('sigle_lotto').select('id, codice').eq('is_active', true),
    supabase.schema(REGISTRY_SCHEMA).from('articoli').select('id, nome').eq('is_active', true),
    supabase.schema(REGISTRY_SCHEMA).from('imballaggi_secondari').select('id, nome').eq('is_active', true)
  ]);

  const registryError = [sigleResponse.error, articoliResponse.error, imballaggiResponse.error].find((error) => Boolean(error));

  if (registryError) {
    throw new LavorazioniQueryError(registryError.message);
  }

  const lineeById = new Map((lineeResponse.data ?? []).map((linea) => [linea.id, linea.nome]));
  const sigleById = new Map((sigleResponse.data ?? []).map((item) => [item.id, item.codice]));
  const articoliById = new Map((articoliResponse.data ?? []).map((item) => [item.id, item.nome]));
  const imballaggiById = new Map((imballaggiResponse.data ?? []).map((item) => [item.id, item.nome]));

  const pedaneByLavorazioneId = new Map<string, Array<{ numero_colli: number | null; peso_totale: number | null }>>();
  for (const pedana of pedaneAllResponse.data ?? []) {
    const existing = pedaneByLavorazioneId.get(pedana.lavorazione_id) ?? [];
    existing.push({ numero_colli: pedana.numero_colli, peso_totale: pedana.peso_totale });
    pedaneByLavorazioneId.set(pedana.lavorazione_id, existing);
  }

  const mappedLavorazioni: DashboardLavorazioneItem[] = (lavorazioniResponse.data ?? []).map((row) => {
    const pedane = pedaneByLavorazioneId.get(row.id) ?? [];
    const stato = !row.aperta_at ? 'programmata' : row.chiusa_at ? 'terminata' : 'in_corso';

    return {
      id: row.id,
      lineaId: row.linea_id,
      lineaNome: lineeById.get(row.linea_id) ?? 'Linea non trovata',
      stato,
      apertaAt: row.aperta_at,
      chiusaAt: row.chiusa_at,
      lottoLabel: `${sigleById.get(row.sigla_lotto_id) ?? '—'}-${String(row.lotto_ingresso).padStart(3, '0')}`,
      articoloNome: articoliById.get(row.articolo_id) ?? '—',
      imballaggioNome: imballaggiById.get(row.imballaggio_secondario_id) ?? '—',
      note: row.note,
      pedaneCount: pedane.length,
      colliTotali: pedane.reduce((sum, pedana) => sum + Number(pedana.numero_colli ?? 0), 0),
      pesoTotaleKg: pedane.reduce((sum, pedana) => sum + Number(pedana.peso_totale ?? 0), 0)
    };
  });

  const lavorazioniAperte = mappedLavorazioni.filter((item) => item.stato === 'in_corso');
  const lineeAttive = new Set(lavorazioniAperte.map((item) => item.lineaId)).size;

  return {
    summary: {
      lineeAttive,
      lavorazioniAperte: lavorazioniAperte.length,
      pedaneOggi: (pedaneOggiResponse.data ?? []).length,
      colliOggi: (pedaneOggiResponse.data ?? []).reduce((sum, row) => sum + Number(row.numero_colli ?? 0), 0),
      scartoOggiKg: (scartiResponse.data ?? []).reduce((sum, row) => sum + Number(row.peso_kg ?? 0), 0)
    },
    linee: (lineeResponse.data ?? []).map((linea) => ({
      id: linea.id,
      nome: linea.nome,
      lavorazioni: lavorazioniAperte.filter((item) => item.lineaId === linea.id)
    })),
    recenti: mappedLavorazioni.slice(0, 24)
  };
}

export async function createLavorazione(
  supabase: SupabaseClient,
  payload: CreateLavorazionePayload,
  actor: { userId: string; actorName: string }
): Promise<Lavorazione> {
  const insertPayload = {
    linea_id: payload.lineaId,
    sigla_lotto_id: payload.siglaLottoId,
    data_ingresso: payload.dataIngresso,
    lotto_ingresso: payload.lottoIngresso,
    articolo_id: payload.articoloId,
    imballaggio_secondario_id: payload.imballaggioSecondarioId,
    peso_per_collo: payload.pesoPerCollo,
    note: payload.note,
    aperta_at: payload.apertaAt,
    chiusa_at: null,
    aperta_da: payload.apertaDa,
    created_by: actor.userId
  };

  const { data, error } = await supabase.schema(OPS_SCHEMA).from('lavorazioni').insert(insertPayload).select('*').single();

  if (error || !data) {
    throw new LavorazioniQueryError(error?.message ?? 'Inserimento lavorazione non riuscito.');
  }

  const action = payload.apertaAt ? 'open' : 'insert';
  const { error: auditError } = await supabase.rpc('log_audit_event', {
    actor_id: actor.userId,
    actor_name: actor.actorName,
    schema_name: OPS_SCHEMA,
    table_name: 'lavorazioni',
    record_id: data.id,
    action,
    old_value: null,
    new_value: data,
    reason: null
  });

  if (auditError) {
    throw new LavorazioniQueryError(auditError.message);
  }

  return {
    id: data.id,
    lineaId: data.linea_id,
    siglaLottoId: data.sigla_lotto_id,
    dataIngresso: data.data_ingresso,
    lottoIngresso: data.lotto_ingresso,
    articoloId: data.articolo_id,
    imballaggioSecondarioId: data.imballaggio_secondario_id,
    pesoPerCollo: data.peso_per_collo,
    note: data.note,
    apertaAt: data.aperta_at,
    chiusaAt: data.chiusa_at,
    apertaDa: data.aperta_da
  };
}

export async function closeLavorazione(
  supabase: SupabaseClient,
  payload: { lavorazioneId: string; reason?: string | null },
  actor: { userId: string; actorName: string }
): Promise<void> {
  const { data: current, error: currentError } = await supabase
    .schema(OPS_SCHEMA)
    .from('lavorazioni')
    .select('*')
    .eq('id', payload.lavorazioneId)
    .single();

  if (currentError || !current) {
    throw new LavorazioniQueryError(currentError?.message ?? 'Lavorazione non trovata.');
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .schema(OPS_SCHEMA)
    .from('lavorazioni')
    .update({ chiusa_at: now })
    .eq('id', payload.lavorazioneId)
    .is('chiusa_at', null)
    .select('*')
    .single();

  if (updateError || !updated) {
    throw new LavorazioniQueryError(updateError?.message ?? 'Chiusura lavorazione non riuscita.');
  }

  const { error: auditError } = await supabase.rpc('log_audit_event', {
    actor_id: actor.userId,
    actor_name: actor.actorName,
    schema_name: OPS_SCHEMA,
    table_name: 'lavorazioni',
    record_id: payload.lavorazioneId,
    action: 'close',
    old_value: current,
    new_value: updated,
    reason: payload.reason ?? null
  });

  if (auditError) {
    throw new LavorazioniQueryError(auditError.message);
  }
}

export async function reopenLavorazione(
  supabase: SupabaseClient,
  payload: { lavorazioneId: string; reason?: string | null },
  actor: { userId: string; actorName: string }
): Promise<void> {
  const { data: current, error: currentError } = await supabase
    .schema(OPS_SCHEMA)
    .from('lavorazioni')
    .select('*')
    .eq('id', payload.lavorazioneId)
    .single();

  if (currentError || !current) {
    throw new LavorazioniQueryError(currentError?.message ?? 'Lavorazione non trovata.');
  }

  const { data: updated, error: updateError } = await supabase
    .schema(OPS_SCHEMA)
    .from('lavorazioni')
    .update({ chiusa_at: null, aperta_at: current.aperta_at ?? new Date().toISOString(), aperta_da: actor.userId })
    .eq('id', payload.lavorazioneId)
    .not('chiusa_at', 'is', null)
    .select('*')
    .single();

  if (updateError || !updated) {
    throw new LavorazioniQueryError(updateError?.message ?? 'Riapertura lavorazione non riuscita.');
  }

  const { error: auditError } = await supabase.rpc('log_audit_event', {
    actor_id: actor.userId,
    actor_name: actor.actorName,
    schema_name: OPS_SCHEMA,
    table_name: 'lavorazioni',
    record_id: payload.lavorazioneId,
    action: 'reopen',
    old_value: current,
    new_value: updated,
    reason: payload.reason ?? null
  });

  if (auditError) {
    throw new LavorazioniQueryError(auditError.message);
  }
}
