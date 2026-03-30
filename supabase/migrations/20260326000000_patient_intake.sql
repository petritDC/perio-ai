-- patient_intake_submissions table
create table if not exists public.patient_intake_submissions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  submitted_at        timestamptz not null default now(),
  form_version        text not null default 'patient_intake_v3',
  personal_info       jsonb not null default '{}',
  allergies           jsonb not null default '[]',
  medical_history     jsonb not null default '[]',
  risk_factors        jsonb not null default '{}',
  current_medications jsonb not null default '[]',
  emergency_contacts  jsonb not null default '[]',
  x_ray_availability  jsonb not null default '{}',
  doctor_notes        text not null default '',
  consents            jsonb not null default '{}',
  status              text not null default 'pending_review'
    check (status in ('pending_review', 'reviewed', 'archived'))
);

-- Indexes
create index on public.patient_intake_submissions (user_id);
create index on public.patient_intake_submissions (submitted_at desc);

-- RLS
alter table public.patient_intake_submissions enable row level security;

create policy "Patients can insert own intake"
  on public.patient_intake_submissions for insert
  with check (auth.uid() = user_id);

create policy "Patients can read own intake"
  on public.patient_intake_submissions for select
  using (auth.uid() = user_id);

create policy "Staff can read all intake submissions"
  on public.patient_intake_submissions for select
  using (
    exists (
      select 1 from auth.users u
      where u.id = auth.uid()
        and u.raw_user_meta_data->>'role' in ('admin', 'dentist', 'hygienist', 'receptionist')
    )
  );
