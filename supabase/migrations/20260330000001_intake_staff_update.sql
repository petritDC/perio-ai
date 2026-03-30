-- Allow staff to update intake submission status (e.g. pending_review -> reviewed)
CREATE POLICY "Staff can update intake status"
  ON public.patient_intake_submissions FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')
      IN ('admin', 'dentist', 'hygienist', 'receptionist')
  );
