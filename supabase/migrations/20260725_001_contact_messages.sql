-- Create contact_messages table for the public contact form
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.contact_messages enable row level security;

-- Policy: anyone can insert (public contact form, anon users included)
create policy "Anyone can insert contact messages"
  on public.contact_messages
  for insert
  to anon, authenticated
  with check (true);

-- Policy: only admins can read contact messages
create policy "Admins can read contact messages"
  on public.contact_messages
  for select
  to authenticated
  using (public.is_admin());

-- Index on created_at for efficient ordering / querying
create index idx_contact_messages_created_at
  on public.contact_messages (created_at desc);
