import { type SupabaseClient } from '@supabase/supabase-js';

import { OPS_SCHEMA, REGISTRY_SCHEMA } from '@/lib/config/db';
import type { Articolo, ImballaggioSecondario, Lavorazione, Linea, SiglaLotto } from '@/types/domain';

type ProdottoGrezzoSummary = {
  id: string;
  nome: string;
};

type VarietaSummary = {
  id: string;
  nome: string;
};

export type SiglaLottoWithRelations = SiglaLotto & {
  prodottoGrezzo: ProdottoGrezzoSummary;
  varieta: VarietaSummary;
};

export type Imballaggio = ImballaggioSecondario;

export type WorkOrderFormData = {
  linee: Linea[];
  sigleLotto: SiglaLottoWithRelations[];
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

type RegistryBaseRow = {
  id: string;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
  is_active: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
};

type LineaRow = RegistryBaseRow & {
  nome: string;
  descrizione: string | null;
  ordine: number | null;
};

type SiglaLottoRow = RegistryBaseRow & {
  codice: string;
  produttore: string;
  prodotto_grezzo_id: string;
  varieta_id: string;
  campo: string | null;
};

type ProdottoGrezzoRow = RegistryBaseRow & {
  nome: string;
};

type VarietaRow = RegistryBaseRow & {
  nome: string;
};

type ArticoloRow = RegistryBaseRow & {
  nome: string;
  descrizione: string | null;
  peso_per_collo: number;
  peso_variabile: boolean;
  vincolo_prodotto_grezzo_id: string | null;
  vincolo_varieta_id: string | null;
};

type ImballaggioRow = RegistryBaseRow & {
  nome: string;
  descrizione: string | null;
  tara_kg: number | null;
  lunghezza_cm: number | null;
  larghezza_cm: number | null;
  altezza_cm: number | null;
};

type LavorazioneRow = {
  id: string;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
  linea_id: string;
  sigla_lotto_id: string;
  data_ingresso: string;
  lotto_ingresso: number;
  articolo_id: string;
  imballaggio_secondario_id: string;
  peso_per_collo: number;
  note: string | null;
  aperta_at: string | null;
  chiusa_at: string | null;
  aperta_da: string | null;
};

function mapLinea(row: LineaRow): Linea {
  return {
    id: row.id,
    nome: row.nome,
    descrizione: row.descrizione,
    ordine: row.ordine,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    isActive: row.is_active,
    deletedAt: row.deleted_at,
    deletedBy: row.deleted_by
  };
}

function mapArticolo(row: ArticoloRow): Articolo {
  return {
    id: row.id,
    nome: row.nome,
    descrizione: row.descrizione,
    pesoPerCollo: row.peso_per_collo,
    pesoVariabile: row.peso_variabile,
    vincoloProdottoGrezzoId: row.vincolo_prodotto_grezzo_id,
    vincoloVarietaId: row.vincolo_varieta_id,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    isActive: row.is_active,
    deletedAt: row.deleted_at,
    deletedBy: row.deleted_by
  };
}

function mapImballaggio(row: ImballaggioRow): Imballaggio {
  return {
    id: row.id,
    nome: row.nome,
    descrizione: row.descrizione,
    taraKg: row.tara_kg,
    lunghezzaCm: row.lunghezza_cm,
    larghezzaCm: row.larghezza_cm,
    altezzaCm: row.altezza_cm,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    isActive: row.is_active,
    deletedAt: row.deleted_at,
    deletedBy: row.deleted_by
  };
}

function mapLavorazione(row: LavorazioneRow): Lavorazione {
  return {
    id: row.id,
    lineaId: row.linea_id,
    siglaLottoId: row.sigla_lotto_id,
    dataIngresso: row.data_ingresso,
    lottoIngresso: row.lotto_ingresso,
    articoloId: row.articolo_id,
    imballaggioSecondarioId: row.imballaggio_secondario_id,
    pesoPerCollo: row.peso_per_collo,
    note: row.note,
    apertaAt: row.aperta_at,
    chiusaAt: row.chiusa_at,
    apertaDa: row.aperta_da,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by
  };
}

export async function fetchNewWorkOrderFormData(supabase: SupabaseClient): Promise<WorkOrderFormData> {
  const [lineeResult, sigleResult, prodottiResult, varietaResult, articoliResult, imballaggiResult, lavorazioniResult] =
    await Promise.all([
      supabase.schema(REGISTRY_SCHEMA).from('linee').select('*').eq('is_active', true).order('ordine', { ascending: true }),
      supabase.schema(REGISTRY_SCHEMA).from('sigle_lotto').select('*').order('codice', { ascending: true }),
      supabase.schema(REGISTRY_SCHEMA).from('prodotti_grezzi').select('id,nome').eq('is_active', true),
      supabase.schema(REGISTRY_SCHEMA).from('varieta').select('id,nome').eq('is_active', true),
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
        .select('id,linea_id')
        .not('aperta_at', 'is', null)
        .is('chiusa_at', null)
    ]);

  if (lineeResult.error) throw lineeResult.error;
  if (sigleResult.error) throw sigleResult.error;
  if (prodottiResult.error) throw prodottiResult.error;
  if (varietaResult.error) throw varietaResult.error;
  if (articoliResult.error) throw articoliResult.error;
  if (imballaggiResult.error) throw imballaggiResult.error;
  if (lavorazioniResult.error) throw lavorazioniResult.error;

  const prodottoById = new Map((prodottiResult.data as ProdottoGrezzoRow[]).map((row) => [row.id, row.nome]));
  const varietaById = new Map((varietaResult.data as VarietaRow[]).map((row) => [row.id, row.nome]));

  const sigleLotto = (sigleResult.data as SiglaLottoRow[]).map((row) => ({
    id: row.id,
    codice: row.codice,
    produttore: row.produttore,
    prodottoGrezzoId: row.prodotto_grezzo_id,
    varietaId: row.varieta_id,
    campo: row.campo,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    prodottoGrezzo: {
      id: row.prodotto_grezzo_id,
      nome: prodottoById.get(row.prodotto_grezzo_id) ?? '—'
    },
    varieta: {
      id: row.varieta_id,
      nome: varietaById.get(row.varieta_id) ?? '—'
    }
  }));

  return {
    linee: (lineeResult.data as LineaRow[]).map(mapLinea),
    sigleLotto,
    articoli: (articoliResult.data as ArticoloRow[]).map(mapArticolo),
    imballaggi: (imballaggiResult.data as ImballaggioRow[]).map(mapImballaggio),
    lavorazioniInCorso: (lavorazioniResult.data as { id: string; linea_id: string }[]).map((row) => ({
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
    aperta_da: payload.apertaDa,
    created_by: actor.userId
  };

  const { data, error } = await supabase.schema(OPS_SCHEMA).from('lavorazioni').insert(insertPayload).select('*').single();

  if (error) {
    throw error;
  }

  const lavorazione = mapLavorazione(data as LavorazioneRow);

  const action = payload.apertaAt ? 'open' : 'schedule';
  const { error: auditError } = await supabase.rpc('log_audit_event', {
    actor_id: actor.userId,
    actor_name: actor.actorName,
    schema_name: OPS_SCHEMA,
    table_name: 'lavorazioni',
    record_id: lavorazione.id,
    action,
    old_value: null,
    new_value: data,
    reason: null
  });

  if (auditError) {
    throw auditError;
  }

  return lavorazione;
}
