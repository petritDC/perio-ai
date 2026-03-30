-- Periodontal chart header (one per visit/session)
CREATE TABLE IF NOT EXISTS periodontal_charts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES profiles(id),
  chart_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','finalized')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Individual tooth measurements (6 sites: DB, B, MB, DL, L, ML)
-- tooth_number: FDI notation 11-18, 21-28, 31-38, 41-48
CREATE TABLE IF NOT EXISTS chart_teeth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_id uuid NOT NULL REFERENCES periodontal_charts(id) ON DELETE CASCADE,
  tooth_number int NOT NULL,
  -- Pocket depths (mm) for 6 sites
  pd_db int, pd_b int, pd_mb int,
  pd_dl int, pd_l int, pd_ml int,
  -- Recession (mm) for 6 sites
  rec_db int, rec_b int, rec_mb int,
  rec_dl int, rec_l int, rec_ml int,
  -- Bleeding on probing (boolean per site)
  bop_db boolean DEFAULT false, bop_b boolean DEFAULT false, bop_mb boolean DEFAULT false,
  bop_dl boolean DEFAULT false, bop_l boolean DEFAULT false, bop_ml boolean DEFAULT false,
  -- Furcation involvement (0=none, 1=class I, 2=class II, 3=class III)
  furcation int DEFAULT 0 CHECK (furcation BETWEEN 0 AND 3),
  mobility int DEFAULT 0 CHECK (mobility BETWEEN 0 AND 3),
  implant boolean DEFAULT false,
  missing boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chart_id, tooth_number)
);

CREATE INDEX IF NOT EXISTS chart_teeth_chart_id_idx ON chart_teeth (chart_id);
CREATE INDEX IF NOT EXISTS periodontal_charts_patient_idx ON periodontal_charts (patient_id, chart_date DESC);

CREATE TRIGGER periodontal_charts_updated_at
  BEFORE UPDATE ON periodontal_charts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER chart_teeth_updated_at
  BEFORE UPDATE ON chart_teeth
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Prevent editing finalized charts
CREATE OR REPLACE FUNCTION prevent_finalized_chart_edit()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'finalized' AND NEW.status = 'finalized' THEN
    RAISE EXCEPTION 'Cannot modify a finalized chart';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chart_immutable_finalized
  BEFORE UPDATE ON periodontal_charts
  FOR EACH ROW EXECUTE FUNCTION prevent_finalized_chart_edit();

-- RLS
ALTER TABLE periodontal_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_teeth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_read_charts" ON periodontal_charts
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','dentist','hygienist','receptionist')
    OR patient_id = auth.uid()
  );

CREATE POLICY "provider_insert_charts" ON periodontal_charts
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','dentist','hygienist')
  );

CREATE POLICY "provider_update_charts" ON periodontal_charts
  FOR UPDATE TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','dentist','hygienist')
  );

CREATE POLICY "staff_read_teeth" ON chart_teeth
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM periodontal_charts pc
      WHERE pc.id = chart_id
      AND (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','dentist','hygienist','receptionist')
        OR pc.patient_id = auth.uid()
      )
    )
  );

CREATE POLICY "provider_upsert_teeth" ON chart_teeth
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','dentist','hygienist')
  );

CREATE POLICY "provider_update_teeth" ON chart_teeth
  FOR UPDATE TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','dentist','hygienist')
  );
