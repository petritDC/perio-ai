-- ============================================================
-- profiles: auth user mirror (id = auth.users.id)
-- Must exist before appointments, charting, diagnoses, etc.
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  text,
  role       text NOT NULL DEFAULT 'patient'
               CHECK (role IN ('admin','dentist','hygienist','receptionist','patient')),
  status     text NOT NULL DEFAULT 'active'
               CHECK (status IN ('active','inactive','invited')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_role_idx   ON profiles (role);
CREATE INDEX IF NOT EXISTS profiles_status_idx ON profiles (status);

-- Auto-create profile row on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can read own profile"
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY IF NOT EXISTS "Staff can read all profiles"
  ON profiles FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role')
    IN ('admin','dentist','hygienist','receptionist'));

CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY IF NOT EXISTS "Admin can insert profiles"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ============================================================
-- Fix patient_documents column names (app queries use
-- file_name/file_path/file_size/mime_type)
-- ============================================================

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_documents' AND column_name = 'name'
  ) THEN
    ALTER TABLE patient_documents RENAME COLUMN name TO file_name;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_documents' AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE patient_documents RENAME COLUMN storage_path TO file_path;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_documents' AND column_name = 'size_bytes'
  ) THEN
    ALTER TABLE patient_documents RENAME COLUMN size_bytes TO file_size;
  END IF;
END $$;

ALTER TABLE patient_documents ADD COLUMN IF NOT EXISTS mime_type text;
ALTER TABLE patient_documents ALTER COLUMN uploaded_by DROP NOT NULL;

-- ============================================================
-- clinic_profile + staff_availability (original content)
-- ============================================================

-- Add clinic profile columns to existing profiles table (if not already there)
-- Create staff_availability table for weekly scheduling

-- Clinic profile: store clinic-level config in a singleton row
CREATE TABLE IF NOT EXISTS clinic_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'My Clinic',
  address text,
  phone text,
  email text,
  website text,
  logo_path text,
  timezone text NOT NULL DEFAULT 'Europe/Tirane',
  working_hours_start time NOT NULL DEFAULT '08:00',
  working_hours_end time NOT NULL DEFAULT '18:00',
  slot_duration_minutes int NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed one row so queries always return a record
INSERT INTO clinic_profile (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Staff weekly availability
CREATE TABLE IF NOT EXISTS staff_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day_of_week)
);

-- Trigger for clinic_profile updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clinic_profile_updated_at
  BEFORE UPDATE ON clinic_profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER staff_availability_updated_at
  BEFORE UPDATE ON staff_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE clinic_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;

-- Clinic profile: any authenticated user can read, only admin can write
CREATE POLICY "authenticated_read_clinic" ON clinic_profile
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_update_clinic" ON clinic_profile
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Staff availability: staff reads own rows, admin reads all, staff writes own rows, admin writes all
CREATE POLICY "read_own_availability" ON staff_availability
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'dentist', 'hygienist', 'receptionist')
  );

CREATE POLICY "staff_upsert_own_availability" ON staff_availability
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "staff_update_own_availability" ON staff_availability
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid() OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "admin_delete_availability" ON staff_availability
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
