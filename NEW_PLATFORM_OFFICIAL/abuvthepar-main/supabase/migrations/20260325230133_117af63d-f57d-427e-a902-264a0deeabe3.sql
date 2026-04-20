DROP FUNCTION IF EXISTS increment_sync_retry_count(uuid);

CREATE OR REPLACE FUNCTION increment_sync_retry_count(p_ticket_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE ticket_metadata
  SET sync_retry_count = COALESCE(sync_retry_count, 0) + 1,
      updated_at = now()
  WHERE ticket_id = p_ticket_id;
$$;