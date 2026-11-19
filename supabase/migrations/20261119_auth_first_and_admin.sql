-- Migration: Authentication-First SaaS, Profile Roles, Admin Policies & Audit Logging
-- Applies on top of 20261117_initial_schema.sql

-- 1. Add role, status, and email columns to profiles if they don't exist
alter table public.profiles
  add column if not exists role text not null default 'user',
  add column if not exists status text not null default 'active',
  add column if not exists email text;

-- 2. Create index on profiles role and status
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_status_idx on public.profiles(status);

-- 3. Update handle_new_user() trigger function to populate email and metadata
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_full_name text;
  user_avatar text;
  user_email text;
  assigned_role text;
begin
  user_full_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'Anonymous Creator'
  );
  user_avatar := new.raw_user_meta_data->>'avatar_url';
  user_email := new.email;
  
  -- Determine role: check app_metadata or raw_user_meta_data
  assigned_role := coalesce(
    new.raw_app_meta_data->>'role',
    new.raw_user_meta_data->>'role',
    'user'
  );

  insert into public.profiles (id, name, avatar_url, headline, email, role, status)
  values (
    new.id,
    user_full_name,
    user_avatar,
    'LinkedIn Creator & Writer',
    user_email,
    assigned_role,
    'active'
  )
  on conflict (id) do update set
    name = excluded.name,
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    email = coalesce(excluded.email, profiles.email),
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

-- 4. Admin Policies for Profiles
-- Allow admins (verified via app_metadata or profiles.role) to view and manage all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    (select coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'admin')
    or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    (select coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'admin')
    or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 5. Admin Audit Logs Table
create table if not exists public.admin_audit_logs (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references auth.users(id) on delete set null,
  admin_email text,
  target_user_id text,
  target_user_name text,
  action text not null,
  details text,
  created_at timestamptz default now() not null
);

-- Index for audit logs
create index if not exists admin_audit_logs_created_at_idx on public.admin_audit_logs(created_at desc);

-- Enable RLS on admin_audit_logs
alter table public.admin_audit_logs enable row level security;

-- Only admins can read audit logs
create policy "Admins can view audit logs"
  on public.admin_audit_logs for select
  using (
    (select coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'admin')
    or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Only authenticated admins can insert audit logs
create policy "Admins can insert audit logs"
  on public.admin_audit_logs for insert
  with check (
    (select coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'admin')
    or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
