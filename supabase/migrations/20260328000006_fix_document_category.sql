-- Add 'radiology' to the category check constraint on patient_documents
ALTER TABLE public.patient_documents
  DROP CONSTRAINT IF EXISTS patient_documents_category_check;

ALTER TABLE public.patient_documents
  ADD CONSTRAINT patient_documents_category_check
    CHECK (category IN ('general', 'xray', 'report', 'consent', 'referral', 'other', 'radiology'));
