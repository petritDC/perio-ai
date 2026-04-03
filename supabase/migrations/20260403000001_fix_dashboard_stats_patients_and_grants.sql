-- Dashboard stats: count clinical patients from public.patients (not profiles.role = patient).
-- Grant EXECUTE so authenticated users can call the RPC from the Next.js server client.

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
    'total_patients',        (SELECT COUNT(*)::bigint FROM patients),
    'active_patients',       (SELECT COUNT(*)::bigint FROM patients WHERE status = 'active'),
    'today_appointments',    (SELECT COUNT(*)::bigint FROM appointments
                              WHERE start_time >= CURRENT_DATE::timestamptz
                                AND start_time < (CURRENT_DATE + INTERVAL '1 day')::timestamptz),
    'upcoming_appointments', (SELECT COUNT(*)::bigint FROM appointments
                              WHERE start_time > NOW()
                                AND status IN ('scheduled', 'confirmed')),
    'draft_charts',          (SELECT COUNT(*)::bigint FROM periodontal_charts WHERE status = 'draft'),
    'finalized_charts',      (SELECT COUNT(*)::bigint FROM periodontal_charts WHERE status = 'finalized'),
    'total_diagnoses',       (SELECT COUNT(*)::bigint FROM ai_diagnoses),
    'active_staff',          (SELECT COUNT(*)::bigint FROM profiles WHERE role != 'patient' AND status = 'active')
  ) INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO service_role;
