
-- Delete duplicate fathom-ai call_recordings that have no linked fathom_meeting_notes
DELETE FROM call_recordings
WHERE 'fathom-ai' = ANY(tags)
  AND id NOT IN (
    SELECT recording_id FROM fathom_meeting_notes WHERE recording_id IS NOT NULL
  );
