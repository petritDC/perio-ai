CREATE TABLE IF NOT EXISTS treatment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES profiles(id),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS treatment_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
  tooth_number int,
  procedure_code text,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  priority int NOT NULL DEFAULT 1,
  estimated_cost numeric(10,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS treatment_plans_patient_idx ON treatment_plans (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS treatment_plan_items_plan_idx ON treatment_plan_items (plan_id, priority);

CREATE TRIGGER treatment_plans_updated_at
  BEFORE UPDATE ON treatment_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER treatment_plan_items_updated_at
  BEFORE UPDATE ON treatment_plan_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plan_items ENABLE ROW LEVEL SECURITY;

-- Staff read all, patients read own
CREATE POLICY "staff_read_plans" ON treatment_plans
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','dentist','hygienist','receptionist')
    OR patient_id = auth.uid()
  );

CREATE POLICY "provider_insert_plans" ON treatment_plans
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','dentist'));

CREATE POLICY "provider_update_plans" ON treatment_plans
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','dentist'));

CREATE POLICY "admin_delete_plans" ON treatment_plans
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Items follow parent plan access
CREATE POLICY "staff_read_items" ON treatment_plan_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM treatment_plans tp
      WHERE tp.id = plan_id
      AND (
        (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','dentist','hygienist','receptionist')
        OR tp.patient_id = auth.uid()
      )
    )
  );

CREATE POLICY "provider_insert_items" ON treatment_plan_items
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','dentist'));

CREATE POLICY "provider_update_items" ON treatment_plan_items
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','dentist'));

CREATE POLICY "provider_delete_items" ON treatment_plan_items
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','dentist'));
