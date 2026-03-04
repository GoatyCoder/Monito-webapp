import { type SupabaseClient } from '@supabase/supabase-js';

import { REGISTRY_SCHEMA } from '@/lib/config/db';

export type RegistryTable =
  | 'prodotti_grezzi'
  | 'varieta'
  | 'articoli'
  | 'imballaggi_secondari'
  | 'linee'
  | 'sigle_lotto';

export function fetchRegistryTable(supabase: SupabaseClient, table: RegistryTable, orderBy: string) {
  return supabase.schema(REGISTRY_SCHEMA).from(table).select('*').order(orderBy, { ascending: true });
}

export function fetchRegistryRowById(supabase: SupabaseClient, table: RegistryTable, rowId: string) {
  return supabase.schema(REGISTRY_SCHEMA).from(table).select('*').eq('id', rowId).single();
}

export function createRegistryRow(
  supabase: SupabaseClient,
  table: RegistryTable,
  payload: Record<string, unknown>,
  userId: string
) {
  return supabase
    .schema(REGISTRY_SCHEMA)
    .from(table)
    .insert({ ...payload, created_by: userId })
    .select('*')
    .single();
}

export function updateRegistryRow(
  supabase: SupabaseClient,
  table: RegistryTable,
  rowId: string,
  payload: Record<string, unknown>,
  userId: string
) {
  return supabase
    .schema(REGISTRY_SCHEMA)
    .from(table)
    .update({ ...payload, updated_at: new Date().toISOString(), updated_by: userId })
    .eq('id', rowId)
    .select('*')
    .single();
}

export function setRegistryRowActiveStatus(
  supabase: SupabaseClient,
  table: RegistryTable,
  rowId: string,
  shouldRestore: boolean,
  userId: string
) {
  const now = new Date().toISOString();
  const payload = shouldRestore
    ? {
        is_active: true,
        deleted_at: null,
        deleted_by: null,
        updated_at: now,
        updated_by: userId
      }
    : {
        is_active: false,
        deleted_at: now,
        deleted_by: userId,
        updated_at: now,
        updated_by: userId
      };

  return supabase.schema(REGISTRY_SCHEMA).from(table).update(payload).eq('id', rowId).select('*').single();
}

export function deleteRegistryRow(supabase: SupabaseClient, table: RegistryTable, rowId: string) {
  return supabase.schema(REGISTRY_SCHEMA).from(table).delete().eq('id', rowId).select('*').single();
}

export function fetchCurrentUser(supabase: SupabaseClient) {
  return supabase.auth.getUser();
}
