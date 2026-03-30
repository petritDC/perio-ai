create table if not exists notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  type         text not null,
  title        text not null,
  body         text,
  entity_id    uuid,
  entity_type  text,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

create index on notifications (user_id, created_at desc);
create index on notifications (user_id, is_read) where is_read = false;

alter table notifications enable row level security;

create policy "Users can read their own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on notifications for update
  using (auth.uid() = user_id);

create policy "Authenticated users can insert notifications"
  on notifications for insert
  with check (auth.role() = 'authenticated');

create policy "Users can delete their own notifications"
  on notifications for delete
  using (auth.uid() = user_id);
