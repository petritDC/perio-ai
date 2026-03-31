-- supabase/migrations/20260331000001_performance_indexes.sql

-- Enable trigram extension for fast ilike search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram indexes for patient ilike search
-- These turn `ilike '%x%'` from a full table scan into a ~10ms index lookup
CREATE INDEX IF NOT EXISTS patients_full_name_trgm_idx
  ON patients USING GIN (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS patients_email_trgm_idx
  ON patients USING GIN (email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS patients_medical_record_no_trgm_idx
  ON patients USING GIN (medical_record_no gin_trgm_ops);

-- GIN trigram index for radiology patient search on profiles
CREATE INDEX IF NOT EXISTS profiles_full_name_trgm_idx
  ON profiles USING GIN (full_name gin_trgm_ops);

-- Composite index for patient list (status filter + created_at sort)
-- Replaces the two separate single-column indexes for this query pattern
CREATE INDEX IF NOT EXISTS patients_status_created_at_idx
  ON patients (status, created_at DESC);

-- Index on patient_intake_submissions.status for pending intake query
CREATE INDEX IF NOT EXISTS patient_intake_submissions_status_idx
  ON patient_intake_submissions (status)
  WHERE status = 'pending_review';

-- Single RPC that returns all 8 dashboard counts in one round-trip
-- Replaces 8 separate COUNT queries in getDashboardStats()
-- NOTE: This function runs as SECURITY DEFINER (bypasses RLS) and returns
-- aggregate counts across all rows. It must only be called from server-side
-- code (Next.js Server Components / Route Handlers) where role is already
-- verified by requireRole(). Never expose this RPC to client components.
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_patients',        (SELECT COUNT(*) FROM profiles WHERE role = 'patient'),
    'active_patients',       (SELECT COUNT(*) FROM profiles WHERE role = 'patient' AND status = 'active'),
    'today_appointments',    (SELECT COUNT(*) FROM appointments
                              WHERE start_time >= CURRENT_DATE::timestamptz
                                AND start_time <  (CURRENT_DATE + INTERVAL '1 day')::timestamptz),
    'upcoming_appointments', (SELECT COUNT(*) FROM appointments
                              WHERE start_time > NOW()
                                AND status IN ('scheduled', 'confirmed')),
    'draft_charts',          (SELECT COUNT(*) FROM periodontal_charts WHERE status = 'draft'),
    'finalized_charts',      (SELECT COUNT(*) FROM periodontal_charts WHERE status = 'finalized'),
    'total_diagnoses',       (SELECT COUNT(*) FROM ai_diagnoses),
    'active_staff',          (SELECT COUNT(*) FROM profiles WHERE role != 'patient' AND status = 'active')
  ) INTO result;
  RETURN result;
END;
$$;
