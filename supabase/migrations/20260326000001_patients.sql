-- patients table
create table if not exists public.patients (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  full_name           text not null,
  date_of_birth       date,
  email               text,
  phone               text,
  address             text,
  insurance_provider  text,
  blood_type          text,
  national_id         text,
  medical_record_no   text,
  status              text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  intake_submission_id uuid references public.patient_intake_submissions(id) on delete set null,
  notes               text not null default ''
);

-- patient_documents table
create table if not exists public.patient_documents (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references public.patients(id) on delete cascade,
  uploaded_by  uuid not null references auth.users(id),
  created_at   timestamptz not null default now(),
  name         text not null,
  category     text not null default 'general'
    check (category in ('general', 'xray', 'report', 'consent', 'referral', 'other')),
  storage_path text not null,
  mime_type    text,
  size_bytes   bigint
);

-- Indexes
create index on public.patients (full_name);
create index on public.patients (status);
create index on public.patients (created_at desc);
create index on public.patient_documents (patient_id);
create index on public.patient_documents (category);

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger patients_updated_at
  before update on public.patients
  for each row execute function public.update_updated_at();

-- RLS
alter table public.patients enable row level security;
alter table public.patient_documents enable row level security;

-- Staff can read all patients
create policy "Staff can read patients"
  on public.patients for select
  using (
    exists (
      select 1 from auth.users u
      where u.id = auth.uid()
        and u.raw_user_meta_data->>'role' in ('admin', 'dentist', 'hygienist', 'receptionist')
    )
  );

-- Staff can insert patients
create policy "Staff can insert patients"
  on public.patients for insert
  with check (
    exists (
      select 1 from auth.users u
      where u.id = auth.uid()
        and u.raw_user_meta_data->>'role' in ('admin', 'dentist', 'hygienist', 'receptionist')
    )
  );

-- Staff can update patients
create policy "Staff can update patients"
  on public.patients for update
  using (
    exists (
      select 1 from auth.users u
      where u.id = auth.uid()
        and u.raw_user_meta_data->>'role' in ('admin', 'dentist', 'hygienist', 'receptionist')
    )
  );

-- Patients can read own record (linked via intake)
create policy "Patient can read own record"
  on public.patients for select
  using (
    exists (
      select 1 from public.patient_intake_submissions s
      where s.id = patients.intake_submission_id
        and s.user_id = auth.uid()
    )
  );

-- Staff documents policies
create policy "Staff can read documents"
  on public.patient_documents for select
  using (
    exists (
      select 1 from auth.users u
      where u.id = auth.uid()
        and u.raw_user_meta_data->>'role' in ('admin', 'dentist', 'hygienist', 'receptionist')
    )
  );

create policy "Staff can insert documents"
  on public.patient_documents for insert
  with check (
    auth.uid() = uploaded_by and
    exists (
      select 1 from auth.users u
      where u.id = auth.uid()
        and u.raw_user_meta_data->>'role' in ('admin', 'dentist', 'hygienist', 'receptionist')
    )
  );

create policy "Staff can delete own uploads"
  on public.patient_documents for delete
  using (auth.uid() = uploaded_by);
