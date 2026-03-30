-- Fix RLS policies that incorrectly query auth.users directly.
-- Replace with auth.jwt() -> 'user_metadata' ->> 'role' checks.

-- ── patient_intake_submissions ──────────────────────────────
DROP POLICY IF EXISTS "Staff can read all intake submissions" ON public.patient_intake_submissions;

CREATE POLICY "Staff can read all intake submissions"
  ON public.patient_intake_submissions FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')
      IN ('admin', 'dentist', 'hygienist', 'receptionist')
  );

-- ── patients ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Staff can read patients"     ON public.patients;
DROP POLICY IF EXISTS "Staff can insert patients"   ON public.patients;
DROP POLICY IF EXISTS "Staff can update patients"   ON public.patients;

CREATE POLICY "Staff can read patients"
  ON public.patients FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')
      IN ('admin', 'dentist', 'hygienist', 'receptionist')
  );

CREATE POLICY "Staff can insert patients"
  ON public.patients FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role')
      IN ('admin', 'dentist', 'hygienist', 'receptionist')
  );

CREATE POLICY "Staff can update patients"
  ON public.patients FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')
      IN ('admin', 'dentist', 'hygienist', 'receptionist')
  );

-- ── patient_documents ────────────────────────────────────────
DROP POLICY IF EXISTS "Staff can read documents"   ON public.patient_documents;
DROP POLICY IF EXISTS "Staff can insert documents" ON public.patient_documents;
DROP POLICY IF EXISTS "Staff can delete own uploads" ON public.patient_documents;

CREATE POLICY "Staff can read documents"
  ON public.patient_documents FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role')
      IN ('admin', 'dentist', 'hygienist', 'receptionist')
  );

CREATE POLICY "Staff can insert documents"
  ON public.patient_documents FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role')
      IN ('admin', 'dentist', 'hygienist', 'receptionist')
  );

CREATE POLICY "Staff can delete own uploads"
  ON public.patient_documents FOR DELETE
  USING (
    uploaded_by = auth.uid() OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
