ALTER TABLE public.periodontal_charts
  DROP CONSTRAINT IF EXISTS periodontal_charts_patient_id_fkey;

ALTER TABLE public.periodontal_charts
  ADD CONSTRAINT periodontal_charts_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

ALTER TABLE public.ai_diagnoses
  DROP CONSTRAINT IF EXISTS ai_diagnoses_patient_id_fkey;

ALTER TABLE public.ai_diagnoses
  ADD CONSTRAINT ai_diagnoses_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

ALTER TABLE public.chart_reports
  DROP CONSTRAINT IF EXISTS chart_reports_patient_id_fkey;

ALTER TABLE public.chart_reports
  ADD CONSTRAINT chart_reports_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "staff_read_charts" ON public.periodontal_charts;
CREATE POLICY "staff_read_charts" ON public.periodontal_charts
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','dentist','hygienist','receptionist')
    OR EXISTS (
      SELECT 1
      FROM public.patients p
      JOIN public.patient_intake_submissions s ON s.id = p.intake_submission_id
      WHERE p.id = periodontal_charts.patient_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "staff_read_teeth" ON public.chart_teeth;
CREATE POLICY "staff_read_teeth" ON public.chart_teeth
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.periodontal_charts pc
      WHERE pc.id = chart_id
        AND (
          (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','dentist','hygienist','receptionist')
          OR EXISTS (
            SELECT 1
            FROM public.patients p
            JOIN public.patient_intake_submissions s ON s.id = p.intake_submission_id
            WHERE p.id = pc.patient_id
              AND s.user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "staff_read_diagnoses" ON public.ai_diagnoses;
CREATE POLICY "staff_read_diagnoses" ON public.ai_diagnoses
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','dentist','hygienist','receptionist')
    OR EXISTS (
      SELECT 1
      FROM public.patients p
      JOIN public.patient_intake_submissions s ON s.id = p.intake_submission_id
      WHERE p.id = ai_diagnoses.patient_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "staff_read_reports" ON public.chart_reports;
CREATE POLICY "staff_read_reports" ON public.chart_reports
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin','dentist','hygienist','receptionist')
    OR EXISTS (
      SELECT 1
      FROM public.patients p
      JOIN public.patient_intake_submissions s ON s.id = p.intake_submission_id
      WHERE p.id = chart_reports.patient_id
        AND s.user_id = auth.uid()
    )
  );
