-- Ensure index for radiology queries
CREATE INDEX IF NOT EXISTS patient_documents_radiology_idx
  ON patient_documents (patient_id, category, created_at DESC)
  WHERE category = 'radiology';

-- No schema changes needed — category column already exists
-- This migration is a no-op if the index already exists
