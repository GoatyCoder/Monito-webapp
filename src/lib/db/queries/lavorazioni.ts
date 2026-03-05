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
    aperta_da: payload.apertaDa
  };

  const { data, error } = await supabase.schema(OPS_SCHEMA).from('lavorazioni').insert(insertPayload).select('*').single();

  if (error || !data) {
    throw new LavorazioniQueryError(error?.message ?? 'Inserimento lavorazione non riuscito.');
  }

  const action = payload.apertaAt ? 'open' : 'schedule';
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
