CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES profiles(id),
  title text NOT NULL,
  appointment_type text NOT NULL DEFAULT 'consultation',
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','completed','cancelled','no_show')),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appointments_start_time_idx ON appointments (start_time);
CREATE INDEX IF NOT EXISTS appointments_provider_idx ON appointments (provider_id, start_time);
CREATE INDEX IF NOT EXISTS appointments_patient_idx ON appointments (patient_id, start_time);

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- All authenticated staff can read appointments
CREATE POLICY "staff_read_appointments" ON appointments
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','dentist','hygienist','receptionist')
    OR patient_id = auth.uid()
  );

-- Admin and receptionist can insert
CREATE POLICY "staff_insert_appointments" ON appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','receptionist')
  );

-- Admin and receptionist can update
CREATE POLICY "staff_update_appointments" ON appointments
  FOR UPDATE TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','receptionist')
  );

-- Admin only can delete
CREATE POLICY "admin_delete_appointments" ON appointments
  FOR DELETE TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
