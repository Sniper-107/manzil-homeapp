-- Manzil: Rooms, Planning, Documents
-- Adds room tagging, a purchase-planning module with a budget cap,
-- and generic document attachments (warranty cards, manuals, etc).

-- ---------------------------------------------------------------------
-- Rooms
-- ---------------------------------------------------------------------
create table rooms (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households(id) on delete cascade,
  name          text not null,
  created_at    timestamptz not null default now(),
  unique (household_id, name)
);

alter table assets add column room_id uuid references rooms(id) on delete set null;
alter table maintenance_tasks add column room_id uuid references rooms(id) on delete set null;

alter table rooms enable row level security;

create policy "members can view rooms" on rooms for select
  using (is_household_member(household_id));
create policy "members can insert rooms" on rooms for insert
  with check (is_household_member(household_id));
create policy "members can delete rooms" on rooms for delete
  using (is_household_member(household_id));

-- ---------------------------------------------------------------------
-- Planning: things you intend to buy, before they're a real asset.
-- ---------------------------------------------------------------------
create table planning_items (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references households(id) on delete cascade,
  name              text not null,
  category          text default 'Other'
                      check (category in (
                        'Devices', 'Furniture', 'AC & HVAC', 'Plumbing',
                        'Electrical', 'Ceramic & Tiles', 'Gypsum',
                        'Doors & Windows', 'Paint', 'Car', 'Other'
                      )),
  expected_price    numeric(12, 2),
  expected_vendor   text,
  priority          text not null default 'later' check (priority in ('need_soon', 'later')),
  status            text not null default 'planned' check (status in ('planned', 'purchased', 'cancelled')),
  notes             text,
  room_id           uuid references rooms(id) on delete set null,
  created_by        uuid not null references auth.users(id),
  created_at        timestamptz not null default now(),
  purchased_at      date
);

create index idx_planning_household on planning_items(household_id);

alter table planning_items enable row level security;

create policy "members can view planning items" on planning_items for select
  using (is_household_member(household_id));
create policy "members can insert planning items" on planning_items for insert
  with check (is_household_member(household_id) and auth.uid() = created_by);
create policy "members can update planning items" on planning_items for update
  using (is_household_member(household_id));
create policy "members can delete planning items" on planning_items for delete
  using (is_household_member(household_id));

-- Planning budget cap lives on the household itself — one number the
-- household is aiming to stay under for everything still on the list.
alter table households add column planning_budget numeric(12, 2);

-- ---------------------------------------------------------------------
-- Documents: warranty cards, manuals, anything beyond the receipt photo.
-- Reuses the same storage-path convention as receipts:
--   documents/{household_id}/{uuid}.{ext}
-- ---------------------------------------------------------------------
create table documents (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households(id) on delete cascade,
  asset_id      uuid references assets(id) on delete cascade,
  file_path     text not null,
  file_name     text not null,
  doc_type      text not null default 'other'
                  check (doc_type in ('warranty_card', 'manual', 'invoice', 'other')),
  uploaded_by   uuid not null references auth.users(id),
  created_at    timestamptz not null default now()
);

create index idx_documents_household on documents(household_id);
create index idx_documents_asset on documents(asset_id);

alter table documents enable row level security;

create policy "members can view documents" on documents for select
  using (is_household_member(household_id));
create policy "members can insert documents" on documents for insert
  with check (is_household_member(household_id) and auth.uid() = uploaded_by);
create policy "members can delete documents" on documents for delete
  using (is_household_member(household_id));

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "members can read their household's documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and is_household_member((storage.foldername(name))[1]::uuid)
  );

create policy "members can upload documents for their household"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and is_household_member((storage.foldername(name))[1]::uuid)
  );

create policy "members can delete their household's documents"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and is_household_member((storage.foldername(name))[1]::uuid)
  );

-- ---------------------------------------------------------------------
-- Tighten the warranty dashboard window from 30 to 15 days, per the
-- latest requirement. Views must be dropped and recreated wholesale —
-- security_invoker must be re-specified, and the grant re-issued.
-- ---------------------------------------------------------------------
drop view warranty_dashboard;

create view warranty_dashboard
with (security_invoker = true) as
select
  a.*,
  case
    when a.warranty_expiry_date is null then 'no_warranty'
    when a.warranty_expiry_date < current_date then 'expired'
    when a.warranty_expiry_date <= current_date + interval '15 days' then 'expiring_soon'
    else 'active'
  end as warranty_status
from assets a;

grant select on warranty_dashboard to authenticated;
