-- Deduplicate: keep only the latest submission per user, then add unique constraint.
DELETE FROM public.patient_intake_submissions
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.patient_intake_submissions
  ORDER BY user_id, submitted_at DESC NULLS LAST
);

ALTER TABLE public.patient_intake_submissions
  ADD CONSTRAINT patient_intake_submissions_user_id_key UNIQUE (user_id);
