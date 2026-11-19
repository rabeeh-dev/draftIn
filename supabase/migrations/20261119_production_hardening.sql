-- Migration: Enterprise Production Hardening & SaaS Reliability
-- File: supabase/migrations/20261119_production_hardening.sql
-- Applies on top of 20261119_saas_data_completeness.sql

-- 1. Security Definer Helper Functions with explicit search_path
create or replace function public.is_admin()
returns boolean as $$
begin
  return (
    coalesce(auth.jwt()->'app_metadata'->>'role', '') = 'admin'
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

create or replace function public.is_user_active(check_user_id uuid)
returns boolean as $$
declare
  user_status text;
begin
  select status into user_status from public.profiles where id = check_user_id;
  return coalesce(user_status, 'active') = 'active';
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- 2. Harden existing trigger function handle_new_user with search_path
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
  
  -- Determine role strictly: only allow app_metadata (trusted server claim)
  assigned_role := coalesce(
    new.raw_app_meta_data->>'role',
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
$$ language plpgsql security definer set search_path = public, pg_temp;

-- 3. Prevent Client Privilege Escalation on public.profiles
create or replace function public.protect_profile_roles()
returns trigger as $$
begin
  -- Prevent non-admins from altering role or status
  if (new.role <> old.role or new.status <> old.status) then
    if not public.is_admin() then
      raise exception 'Unauthorized: Only administrators can modify account roles or moderation status.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists on_profile_role_protection on public.profiles;
create trigger on_profile_role_protection
  before update on public.profiles
  for each row execute function public.protect_profile_roles();

-- 4. Draft Reliability Enhancements (JSONB, Versioning, Soft Deletion)
alter table public.drafts
  add column if not exists content_json jsonb,
  add column if not exists version integer not null default 1,
  add column if not exists deleted_at timestamptz,
  add column if not exists last_saved_at timestamptz default now();

create index if not exists drafts_deleted_at_idx on public.drafts(deleted_at);
create index if not exists drafts_version_idx on public.drafts(version);

-- 5. Draft Versions Table (Point-in-time History)
create table if not exists public.draft_versions (
  id uuid default gen_random_uuid() primary key,
  draft_id uuid references public.drafts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  version_number integer not null,
  title text not null,
  content text not null,
  content_json jsonb,
  created_at timestamptz default now() not null
);

create index if not exists draft_versions_draft_id_idx on public.draft_versions(draft_id, version_number desc);
create index if not exists draft_versions_user_id_idx on public.draft_versions(user_id);

alter table public.draft_versions enable row level security;

create policy "Users can view versions of their drafts"
  on public.draft_versions for select
  using (auth.uid() = user_id and public.is_user_active(auth.uid()));

create policy "Users can insert versions for their drafts"
  on public.draft_versions for insert
  with check (auth.uid() = user_id and public.is_user_active(auth.uid()));

create policy "Admins can view all draft versions"
  on public.draft_versions for select
  using (public.is_admin());

-- 6. Strict RLS Policies for drafts enforcing active status
drop policy if exists "Users can view their own drafts" on public.drafts;
create policy "Users can view their own drafts"
  on public.drafts for select
  using (
    auth.uid() = user_id 
    and public.is_user_active(auth.uid())
    and deleted_at is null
  );

drop policy if exists "Users can create their own drafts" on public.drafts;
create policy "Users can create their own drafts"
  on public.drafts for insert
  with check (
    auth.uid() = user_id 
    and public.is_user_active(auth.uid())
  );

drop policy if exists "Users can update their own drafts" on public.drafts;
create policy "Users can update their own drafts"
  on public.drafts for update
  using (
    auth.uid() = user_id 
    and public.is_user_active(auth.uid())
  );

drop policy if exists "Users can delete their own drafts" on public.drafts;
create policy "Users can delete their own drafts"
  on public.drafts for delete
  using (
    auth.uid() = user_id 
    and public.is_user_active(auth.uid())
  );

-- 7. Audit Log Immutability (Append-only)
revoke update, delete on public.admin_audit_logs from public, anon, authenticated;

-- 8. Subscriptions & Monetization Schema (Phase 14 Scaffolding)
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  status text not null default 'active',
  plan_id text not null default 'free',
  current_period_end timestamptz,
  cancel_at_period_end boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_plan_id_idx on public.subscriptions(plan_id);

alter table public.subscriptions enable row level security;

create policy "Users can view their own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Admins can view all subscriptions"
  on public.subscriptions for select
  using (public.is_admin());

create policy "Admins can update subscriptions"
  on public.subscriptions for update
  using (public.is_admin());
