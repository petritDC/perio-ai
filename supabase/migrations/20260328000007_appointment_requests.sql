-- Allow patients to request appointments (no provider assigned yet)
ALTER TABLE appointments
  ALTER COLUMN provider_id DROP NOT NULL;

-- Add 'requested' status for patient self-service
ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_status_check
    CHECK (status IN ('requested', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'));

-- RLS: patients can insert their own appointment requests
CREATE POLICY "Patients can request appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id = auth.uid() AND
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'patient'
  );

-- RLS: patients can see their own appointments
CREATE POLICY "Patients can view own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    patient_id = auth.uid()
  );
