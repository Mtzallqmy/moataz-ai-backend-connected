-- Moataz AI Supabase schema
-- Run this file once in Supabase SQL Editor before deploying the backend.
-- Important: keep SUPABASE_SERVICE_ROLE_KEY only in Railway, never in Vercel.

create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  avatar_url text,
  role text not null default 'Owner',
  status text not null default 'active',
  last_active_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  name text not null,
  slug text not null,
  type text not null default 'custom',
  description text default '',
  base_url text not null,
  api_key_encrypted text,
  default_model text,
  region text default 'global',
  status text not null default 'pending',
  supported_features text[] not null default array['chat'],
  latency_ms integer not null default 0,
  uptime_pct numeric not null default 100,
  error_rate numeric not null default 0,
  request_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists providers_user_id_idx on public.providers(user_id);

create table if not exists public.app_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  name text not null,
  key_hash text not null unique,
  key_prefix text not null,
  masked_key text not null,
  status text not null default 'active',
  scopes text[] not null default array['chat'],
  usage_limit integer,
  usage_count integer not null default 0,
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_api_keys_user_id_idx on public.app_api_keys(user_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete set null,
  model_id text,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_user_id_idx on public.chat_messages(user_id);

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete set null,
  provider_name text,
  model_id text,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  cost numeric not null default 0,
  latency_ms integer not null default 0,
  status text not null default 'success',
  error_message text,
  level text default 'info',
  method text default 'POST',
  path text default '/api/playground/chat',
  status_code integer default 200,
  message text default 'Request completed',
  metadata jsonb not null default '{}'::jsonb,
  api_key_id uuid references public.app_api_keys(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists usage_logs_user_id_idx on public.usage_logs(user_id);
create index if not exists usage_logs_created_at_idx on public.usage_logs(created_at);

create table if not exists public.validation_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete cascade,
  provider_name text,
  model_id text,
  model_name text,
  test_name text not null,
  status text not null,
  duration_ms integer not null default 0,
  score numeric,
  message text,
  category text default 'provider',
  checked_at timestamptz not null default now()
);

create index if not exists validation_results_user_id_idx on public.validation_results(user_id);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.app_users(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_user_id_idx on public.audit_logs(user_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info',
  read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id);

create table if not exists public.telegram_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  bot_username text not null,
  bot_token_encrypted text not null,
  default_provider_id uuid references public.providers(id) on delete set null,
  default_model text not null,
  status text not null default 'connected',
  webhook_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists telegram_integrations_user_id_idx on public.telegram_integrations(user_id);

create table if not exists public.repository_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  name text not null,
  provider text not null default 'github',
  owner text not null,
  repo text not null,
  default_branch text default 'main',
  token_encrypted text not null,
  status text not null default 'connected',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists repository_connections_user_id_idx on public.repository_connections(user_id);

-- RLS: users can read their own rows when using Supabase directly.
-- The Railway backend uses the service role key and enforces ownership in code.
alter table public.app_users enable row level security;
alter table public.providers enable row level security;
alter table public.app_api_keys enable row level security;
alter table public.chat_messages enable row level security;
alter table public.usage_logs enable row level security;
alter table public.validation_results enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.telegram_integrations enable row level security;
alter table public.repository_connections enable row level security;

drop policy if exists "app_users_own" on public.app_users;
create policy "app_users_own" on public.app_users
for all to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "providers_own" on public.providers;
create policy "providers_own" on public.providers
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "app_api_keys_own" on public.app_api_keys;
create policy "app_api_keys_own" on public.app_api_keys
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "chat_messages_own" on public.chat_messages;
create policy "chat_messages_own" on public.chat_messages
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "usage_logs_own" on public.usage_logs;
create policy "usage_logs_own" on public.usage_logs
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "validation_results_own" on public.validation_results;
create policy "validation_results_own" on public.validation_results
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "audit_logs_own" on public.audit_logs;
create policy "audit_logs_own" on public.audit_logs
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "notifications_own" on public.notifications;
create policy "notifications_own" on public.notifications
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "telegram_integrations_own" on public.telegram_integrations;
create policy "telegram_integrations_own" on public.telegram_integrations
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "repository_connections_own" on public.repository_connections;
create policy "repository_connections_own" on public.repository_connections
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
