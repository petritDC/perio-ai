-- Storage RLS policies for the 'documents' bucket

-- Allow staff to upload (INSERT)
CREATE POLICY "Staff can upload to documents bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    (auth.jwt() -> 'user_metadata' ->> 'role')
      IN ('admin', 'dentist', 'hygienist', 'receptionist')
  );

-- Allow staff to read (SELECT)
CREATE POLICY "Staff can read from documents bucket"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (auth.jwt() -> 'user_metadata' ->> 'role')
      IN ('admin', 'dentist', 'hygienist', 'receptionist')
  );

-- Allow uploader or admin to delete (DELETE)
CREATE POLICY "Staff can delete from documents bucket"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (
      owner = auth.uid() OR
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    )
  );
