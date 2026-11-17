-- Migration: Initial Schema for Profiles, Drafts and Row Level Security (RLS)
-- Execution: Run in Supabase SQL Editor or apply via Supabase CLI

-- 1. Enable Extensions
create extension if not exists "uuid-ossp";

-- 2. Custom Types
do $$ begin
  create type public.draft_status as enum ('draft', 'scheduled', 'published');
exception
  when duplicate_object then null;
end $$;

-- 3. Profiles Table (linked to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null default 'Anonymous Creator',
  headline text default 'Professional Creator',
  avatar_url text,
  username text unique,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 4. Drafts Table
create table if not exists public.drafts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null default 'Untitled Draft',
  content text not null default '',
  status public.draft_status default 'draft' not null,
  is_starred boolean default false not null,
  tags text[] default array[]::text[] not null,
  scheduled_for timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 5. Indexes for fast retrieval
create index if not exists drafts_user_id_idx on public.drafts(user_id);
create index if not exists drafts_status_idx on public.drafts(status);
create index if not exists drafts_updated_at_idx on public.drafts(updated_at desc);

-- 6. Automatically create profile on new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url, headline)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'LinkedIn Creator & Writer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7. Row Level Security (RLS) Configuration

-- Enable RLS on both tables
alter table public.profiles enable row level security;
alter table public.drafts enable row level security;

-- Profiles Policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Drafts Policies (Full CRUD restricted to owner)
create policy "Users can view their own drafts"
  on public.drafts for select
  using (auth.uid() = user_id);

create policy "Users can create their own drafts"
  on public.drafts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own drafts"
  on public.drafts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own drafts"
  on public.drafts for delete
  using (auth.uid() = user_id);
