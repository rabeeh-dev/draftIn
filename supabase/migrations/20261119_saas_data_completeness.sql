-- Migration: SaaS Data Completeness, Admin Draft Oversight, User Preferences & Realtime
-- Applies on top of 20261119_auth_first_and_admin.sql

-- 1. Add user preferences JSON column to profiles (for workspace layout, preview mode, etc.)
alter table public.profiles
  add column if not exists preferences jsonb default '{"editorLayout": "split", "previewDevice": "desktop"}'::jsonb;

-- 2. Add client-side insert policy for profiles as safety net alongside auth trigger
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);


-- 3. Admin Oversight Policies for Drafts
-- Allows administrators to query global draft metrics and manage content in Admin Console
create policy "Admins can view all drafts"
  on public.drafts for select
  using (
    (select coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'admin')
    or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update all drafts"
  on public.drafts for update
  using (
    (select coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'admin')
    or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete any draft"
  on public.drafts for delete
  using (
    (select coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'admin')
    or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 4. Fast indexing for analytics and timeline queries
create index if not exists drafts_created_at_idx on public.drafts(created_at desc);

-- 5. Enable Supabase Realtime for instant synchronization across sessions
do $$ begin
  alter publication supabase_realtime add table public.drafts;
exception when others then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.profiles;
exception when others then null;
end $$;
