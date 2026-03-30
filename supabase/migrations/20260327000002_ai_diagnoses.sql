-- Immutable AI diagnosis records (insert-only, no updates)
CREATE TABLE IF NOT EXISTS ai_diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_id uuid NOT NULL REFERENCES periodontal_charts(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  generated_by uuid REFERENCES profiles(id),
  -- AAP/EFP 2017 classification output
  stage text,
  grade text,
  extent text,
  -- Structured findings
  findings jsonb NOT NULL DEFAULT '{}',
  -- Raw AI response text
  raw_response text,
  model_used text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- No updated_at — this table is insert-only (immutable history)
CREATE INDEX IF NOT EXISTS ai_diagnoses_chart_idx ON ai_diagnoses (chart_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_diagnoses_patient_idx ON ai_diagnoses (patient_id, created_at DESC);

ALTER TABLE ai_diagnoses ENABLE ROW LEVEL SECURITY;

-- Prevent all updates and deletes — insert-only
CREATE POLICY "no_update_diagnoses" ON ai_diagnoses
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "no_delete_diagnoses" ON ai_diagnoses
  FOR DELETE TO authenticated
  USING (false);

-- Staff can read
CREATE POLICY "staff_read_diagnoses" ON ai_diagnoses
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','dentist','hygienist','receptionist')
    OR patient_id = auth.uid()
  );

-- Providers can insert
CREATE POLICY "provider_insert_diagnoses" ON ai_diagnoses
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','dentist','hygienist')
  );
