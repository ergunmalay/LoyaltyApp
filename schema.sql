-- Run this in your Supabase SQL editor (Dashboard > SQL Editor > New query)

-- ─── Tables ───────────────────────────────────────────────────────────────────

create table businesses (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz default now()
);

-- id matches the Supabase auth.users id for the owner
create table staff_users (
  id          uuid primary key,
  business_id uuid not null references businesses(id) on delete cascade,
  name        text not null,
  email       text not null unique,
  role        text not null default 'staff',
  created_at  timestamptz default now()
);

create table promotions (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  title           text not null,
  stamps_required int  not null default 8,
  reward_name     text not null,
  is_active       boolean not null default true,
  created_at      timestamptz default now()
);

create table customers (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name        text not null,
  email       text not null,
  created_at  timestamptz default now()
);

create table wallet_passes (
  id               uuid primary key default gen_random_uuid(),
  customer_id      uuid not null references customers(id) on delete cascade,
  promotion_id     uuid not null references promotions(id) on delete cascade,
  serial_number    text not null unique,
  barcode_value    text not null unique,
  current_stamps   int  not null default 0,
  reward_available boolean not null default false,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create table stamp_events (
  id             uuid primary key default gen_random_uuid(),
  wallet_pass_id uuid not null references wallet_passes(id) on delete cascade,
  staff_user_id  uuid references staff_users(id),
  event_type     text not null check (event_type in ('add', 'remove')),
  notes          text,
  created_at     timestamptz default now()
);

create table redemptions (
  id             uuid primary key default gen_random_uuid(),
  wallet_pass_id uuid not null references wallet_passes(id) on delete cascade,
  staff_user_id  uuid references staff_users(id),
  created_at     timestamptz default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- All API routes use the service_role key which bypasses RLS.
-- RLS is enabled here as a safety net; tighten policies before going to production.

alter table businesses   enable row level security;
alter table staff_users  enable row level security;
alter table promotions   enable row level security;
alter table customers    enable row level security;
alter table wallet_passes enable row level security;
alter table stamp_events enable row level security;
alter table redemptions  enable row level security;

-- Permissive MVP policies — restrict per-table in production
create policy "service_role bypass" on businesses    for all using (true);
create policy "service_role bypass" on staff_users   for all using (true);
create policy "service_role bypass" on promotions    for all using (true);
create policy "service_role bypass" on customers     for all using (true);
create policy "service_role bypass" on wallet_passes for all using (true);
create policy "service_role bypass" on stamp_events  for all using (true);
create policy "service_role bypass" on redemptions   for all using (true);
