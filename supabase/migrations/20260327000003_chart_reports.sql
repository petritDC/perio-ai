CREATE TABLE IF NOT EXISTS chart_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_id uuid NOT NULL REFERENCES periodontal_charts(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  generated_by uuid REFERENCES profiles(id),
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chart_reports_chart_idx ON chart_reports (chart_id);
CREATE INDEX IF NOT EXISTS chart_reports_patient_idx ON chart_reports (patient_id, created_at DESC);

ALTER TABLE chart_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_read_reports" ON chart_reports
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','dentist','hygienist','receptionist')
    OR patient_id = auth.uid()
  );

CREATE POLICY "provider_insert_reports" ON chart_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','dentist','hygienist')
  );

-- Insert-only — no updates or deletes for report records
CREATE POLICY "no_update_reports" ON chart_reports
  FOR UPDATE TO authenticated USING (false);

CREATE POLICY "no_delete_reports" ON chart_reports
  FOR DELETE TO authenticated USING (false);
