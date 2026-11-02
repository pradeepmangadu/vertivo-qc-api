-- Vertivo Delivery QC — schema
create extension if not exists pgcrypto;

create type public.inspection_status as enum
  ('Accepted','Issue found','Missing','Damaged','Not applicable');
create type public.overall_status as enum
  ('Pending inspection','Accepted','Accepted with issues','Rejected / hold');

create table public.profiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  role      text not null default 'inspector' check (role in ('inspector','admin')),
  created_at timestamptz not null default now()
);

-- Every new auth user gets an 'inspector' profile. Promote admins manually (see README).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

create table public.checklist_sections (
  id         smallint primary key generated always as identity,
  name       text not null unique,
  sort_order smallint not null
);

create table public.checklist_items (
  id           integer primary key generated always as identity,
  section_id   smallint not null references public.checklist_sections(id),
  sno          text not null default '',
  name         text not null,
  size         text not null default '',
  material     text not null default '',
  required_qty integer check (required_qty is null or required_qty >= 0),
  sort_order   integer not null
);
create index on public.checklist_items (section_id, sort_order);

create table public.deliveries (
  id              uuid primary key default gen_random_uuid(),
  customer        text not null default '' check (char_length(customer) <= 120),
  location        text not null default '' check (char_length(location) <= 300),
  model           text not null default '' check (char_length(model) <= 80),
  colour          text not null default '' check (char_length(colour) <= 80),
  height_mm       integer check (height_mm is null or height_mm between 0 and 100000),
  width_mm        integer check (width_mm  is null or width_mm  between 0 and 100000),
  depth_mm        integer check (depth_mm  is null or depth_mm  between 0 and 100000),
  inspector       text not null default '' check (char_length(inspector) <= 120),
  site_signoff    text not null default '' check (char_length(site_signoff) <= 120),
  vertivo_signoff text not null default '' check (char_length(vertivo_signoff) <= 120),
  inspection_date date,
  overall_status  public.overall_status,
  version         integer not null default 1,
  created_by      uuid not null references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index on public.deliveries (created_by) where deleted_at is null;

create table public.inspection_records (
  delivery_id      uuid not null references public.deliveries(id) on delete cascade,
  item_id          integer not null references public.checklist_items(id),
  qty_sent         integer check (qty_sent is null or qty_sent >= 0),
  actual_condition text not null default '' check (char_length(actual_condition) <= 200),
  inspection       public.inspection_status,
  remarks          text not null default '' check (char_length(remarks) <= 500),
  photo_path       text,
  version          integer not null default 1,
  updated_by       uuid references public.profiles(id),
  updated_at       timestamptz not null default now(),
  primary key (delivery_id, item_id)
);

create table public.audit_log (
  id         bigint primary key generated always as identity,
  user_id    uuid,
  action     text not null,
  entity     text not null,
  entity_id  text,
  ip         text,
  created_at timestamptz not null default now()
);
create index on public.audit_log (created_at desc);
