-- ============================================================
-- Scan4Serve – Supabase Database Schema
-- Run this in Supabase SQL Editor (Project > SQL Editor)
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- RESTAURANTS
-- ============================================================
create table if not exists restaurants (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text,
  phone text,
  address text,
  logo_url text,
  subscription_status text not null default 'active' check (subscription_status in ('active','expired','suspended')),
  plan text not null default 'basic' check (plan in ('basic','pro','enterprise')),
  subscription_expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- USERS (mirrors Supabase Auth users)
-- ============================================================
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in ('superadmin','admin','manager','submanager','kitchen','waiter')),
  restaurant_id uuid references restaurants(id) on delete set null,
  is_active boolean not null default true,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABLES
-- ============================================================
create table if not exists tables (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_number int not null,
  qr_code_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(restaurant_id, table_number)
);

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists categories (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- MENU ITEMS
-- ============================================================
create table if not exists menu_items (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  available boolean not null default true,
  prep_time_minutes int default 15,
  is_veg boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists orders (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_id uuid not null references tables(id) on delete restrict,
  items jsonb not null default '[]',
  total_amount numeric(10,2) not null,
  status text not null default 'placed' check (status in ('placed','accepted','preparing','ready','served','completed','cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed')),
  special_instructions text,
  priority int not null default 0,
  estimated_time_minutes int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

-- ============================================================
-- AUDIT LOGS
-- ============================================================
create table if not exists audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete set null,
  action text not null,
  details jsonb,
  timestamp timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_users_restaurant_id on users(restaurant_id);
create index if not exists idx_tables_restaurant_id on tables(restaurant_id);
create index if not exists idx_categories_restaurant_id on categories(restaurant_id);
create index if not exists idx_menu_items_restaurant_id on menu_items(restaurant_id);
create index if not exists idx_menu_items_category_id on menu_items(category_id);
create index if not exists idx_orders_restaurant_id on orders(restaurant_id);
create index if not exists idx_orders_table_id on orders(table_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at desc);
create index if not exists idx_audit_logs_user_id on audit_logs(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table restaurants enable row level security;
alter table users enable row level security;
alter table tables enable row level security;
alter table categories enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table audit_logs enable row level security;

-- Service role bypasses RLS (used in server API routes)
-- Anon/authenticated users see only their restaurant's data

-- restaurants: superadmin sees all, others see only their own
create policy "superadmin_all_restaurants" on restaurants
  for all using (
    exists (select 1 from users where id = auth.uid() and role = 'superadmin')
  );

create policy "restaurant_members_own" on restaurants
  for select using (
    exists (select 1 from users where id = auth.uid() and restaurant_id = restaurants.id)
  );

-- users: scoped to same restaurant
create policy "users_own_restaurant" on users
  for all using (
    auth.uid() = id
    or exists (select 1 from users u where u.id = auth.uid() and (u.role = 'superadmin' or u.restaurant_id = users.restaurant_id))
  );

-- tables, categories, menu_items, orders: scoped to restaurant
create policy "restaurant_isolation_tables" on tables
  for all using (
    exists (select 1 from users where id = auth.uid() and (role = 'superadmin' or restaurant_id = tables.restaurant_id))
  );

create policy "restaurant_isolation_categories" on categories
  for all using (
    exists (select 1 from users where id = auth.uid() and (role = 'superadmin' or restaurant_id = categories.restaurant_id))
  );

create policy "restaurant_isolation_menu_items" on menu_items
  for all using (
    exists (select 1 from users where id = auth.uid() and (role = 'superadmin' or restaurant_id = menu_items.restaurant_id))
  );

-- Customer can read menu_items and categories without auth (for QR menu)
create policy "public_read_menu_items" on menu_items
  for select using (true);

create policy "public_read_categories" on categories
  for select using (true);

create policy "public_read_tables" on tables
  for select using (true);

create policy "restaurant_isolation_orders" on orders
  for all using (
    exists (select 1 from users where id = auth.uid() and (role = 'superadmin' or restaurant_id = orders.restaurant_id))
  );

-- Customer can insert + select their own orders (by table)
create policy "public_place_orders" on orders
  for insert with check (true);

create policy "public_track_orders" on orders
  for select using (true);

create policy "superadmin_audit_logs" on audit_logs
  for all using (
    exists (select 1 from users where id = auth.uid() and role = 'superadmin')
  );

-- ============================================================
-- ENABLE REALTIME
-- ============================================================
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table menu_items;
