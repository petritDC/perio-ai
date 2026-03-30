-- Allow upsert on patients by intake_submission_id
ALTER TABLE public.patients
  ADD CONSTRAINT patients_intake_submission_id_key UNIQUE (intake_submission_id);

-- Allow patients to insert their own record via intake (RLS)
CREATE POLICY "Patients can insert own record via intake"
  ON public.patients FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'patient'
  );

-- Allow patients to update their own record via intake
CREATE POLICY "Patients can update own record via intake"
  ON public.patients FOR UPDATE
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
