-- RPC centralizzata per audit log conforme alle regole progetto.
-- Esposta in schema public per compatibilità con supabase.rpc('log_audit_event', ...).
CREATE OR REPLACE FUNCTION public.log_audit_event(
  actor_id uuid,
  actor_name text,
  schema_name text,
  table_name text,
  record_id uuid,
  action text,
  old_value jsonb DEFAULT NULL,
  new_value jsonb DEFAULT NULL,
  reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, audit
AS $$
BEGIN
  INSERT INTO audit.log (
    actor_id,
    actor_name,
    schema_name,
    table_name,
    record_id,
    action,
    old_value,
    new_value,
    reason
  )
  VALUES (
    actor_id,
    actor_name,
    schema_name,
    table_name,
    record_id,
    action,
    old_value,
    new_value,
    reason
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_audit_event(uuid, text, text, text, uuid, text, jsonb, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit_event(uuid, text, text, text, uuid, text, jsonb, jsonb, text) TO authenticated;
