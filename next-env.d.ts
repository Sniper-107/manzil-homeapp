-- Manzil: Home Asset & Maintenance Manager
-- Core schema. Run in the Supabase SQL editor, or via `supabase db push`.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Households: the shared "workspace" a set of users belongs to.
-- ---------------------------------------------------------------------
create table households (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  invite_code   text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  created_by    uuid not null references auth.users(id) on delete cascade,
  created_at    timestamptz not null default now()
);

create table household_members (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references households(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null default 'member' check (role in ('owner', 'member')),
  joined_at     timestamptz not null default now(),
  unique (household_id, user_id)
);

create index idx_household_members_user on household_members(user_id);
create index idx_household_members_household on household_members(household_id);

-- Helper: is the current user a member of a given household?
create or replace function is_household_member(target_household_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from household_members
    where household_id = target_household_id
      and user_id = auth.uid()
  );
$$;

-- Create a household and make the caller its owner, atomically.
-- Called from the app instead of two separate inserts, so it can't
-- fail halfway (household with no owner).
create or replace function create_household(household_name text)
returns uuid
language plpgsql
security definer
as $$
declare
  new_id uuid;
begin
  insert into households (name, created_by)
  values (household_name, auth.uid())
  returning id into new_id;

  insert into household_members (household_id, user_id, role)
  values (new_id, auth.uid(), 'owner');

  return new_id;
end;
$$;

-- Join an existing household using its short invite code.
create or replace function join_household_by_code(code text)
returns uuid
language plpgsql
security definer
as $$
declare
  target_household_id uuid;
begin
  select id into target_household_id
  from households
  where invite_code = code;

  if target_household_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into household_members (household_id, user_id, role)
  values (target_household_id, auth.uid(), 'member')
  on conflict (household_id, user_id) do nothing;

  return target_household_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Receipts: uploaded photo + AI-extracted fields.
-- ---------------------------------------------------------------------
create table receipts (
  id                    uuid primary key default gen_random_uuid(),
  household_id          uuid not null references households(id) on delete cascade,
  image_path            text not null, -- path within the 'receipts' storage bucket
  raw_ai_response        jsonb,
  vendor                text,
  purchase_date         date,
  total_price           numeric(12, 2),
  category              text,
  ocr_language_detected text,
  assumptions           jsonb not null default '[]'::jsonb,
  questions             jsonb not null default '[]'::jsonb,
  uploaded_by           uuid not null references auth.users(id),
  created_at            timestamptz not null default now()
);

create index idx_receipts_household on receipts(household_id);

-- ---------------------------------------------------------------------
-- Assets: physical things bought for the apartment.
-- ---------------------------------------------------------------------
create table assets (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references households(id) on delete cascade,
  name              text not null,
  category          text not null default 'Other'
                      check (category in (
                        'Devices', 'Furniture', 'AC & HVAC', 'Plumbing',
                        'Electrical', 'Ceramic & Tiles', 'Gypsum',
                        'Doors & Windows', 'Paint', 'Car', 'Other'
                      )),
  brand             text,
  model             text,
  vendor            text,
  purchase_date     date,
  price             numeric(12, 2),
  warranty_months   int,
  warranty_expiry_date date generated always as (
    case when purchase_date is not null and warranty_months is not null
      then (purchase_date + (warranty_months * interval '1 month'))::date
      else null
    end
  ) stored,
  receipt_id        uuid references receipts(id) on delete set null,
  notes             text,
  created_by        uuid not null references auth.users(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_assets_household on assets(household_id);
create index idx_assets_warranty_expiry on assets(warranty_expiry_date);

-- ---------------------------------------------------------------------
-- Maintenance: recurring tasks, optionally tied to an asset.
-- ---------------------------------------------------------------------
create table maintenance_tasks (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references households(id) on delete cascade,
  asset_id          uuid references assets(id) on delete set null,
  task_type         text not null, -- e.g. "AC servicing", "Water heater flush"
  frequency_months  int not null check (frequency_months > 0),
  last_done_date    date,
  next_due_date     date generated always as (
    case when last_done_date is not null
      then (last_done_date + (frequency_months * interval '1 month'))::date
      else null
    end
  ) stored,
  notes             text,
  created_by        uuid not null references auth.users(id),
  created_at        timestamptz not null default now()
);

create index idx_maintenance_household on maintenance_tasks(household_id);
create index idx_maintenance_next_due on maintenance_tasks(next_due_date);

create table maintenance_log (
  id                    uuid primary key default gen_random_uuid(),
  maintenance_task_id   uuid not null references maintenance_tasks(id) on delete cascade,
  done_date             date not null default current_date,
  cost                  numeric(12, 2),
  notes                 text,
  done_by               uuid not null references auth.users(id),
  created_at            timestamptz not null default now()
);

create index idx_maintenance_log_task on maintenance_log(maintenance_task_id);

-- ---------------------------------------------------------------------
-- Dashboard views: status is time-relative, so it's computed at query
-- time rather than stored (CURRENT_DATE isn't allowed in generated cols).
-- ---------------------------------------------------------------------
create view maintenance_dashboard
with (security_invoker = true) as
select
  mt.*,
  a.name as asset_name,
  case
    when mt.next_due_date is null then 'not_scheduled'
    when mt.next_due_date < current_date then 'overdue'
    when mt.next_due_date <= current_date + interval '30 days' then 'due_soon'
    else 'upcoming'
  end as status
from maintenance_tasks mt
left join assets a on a.id = mt.asset_id;

create view warranty_dashboard
with (security_invoker = true) as
select
  a.*,
  case
    when a.warranty_expiry_date is null then 'no_warranty'
    when a.warranty_expiry_date < current_date then 'expired'
    when a.warranty_expiry_date <= current_date + interval '30 days' then 'expiring_soon'
    else 'active'
  end as warranty_status
from assets a;

-- Views run as the invoking user's role (security_invoker above), but
-- that role still needs an explicit grant on the view object itself —
-- RLS on the underlying tables does the actual filtering.
grant select on maintenance_dashboard to authenticated;
grant select on warranty_dashboard to authenticated;

-- ---------------------------------------------------------------------
-- updated_at trigger for assets
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_assets_updated_at
  before update on assets
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table households enable row level security;
alter table household_members enable row level security;
alter table receipts enable row level security;
alter table assets enable row level security;
alter table maintenance_tasks enable row level security;
alter table maintenance_log enable row level security;

-- households: visible to members; created by the creator (who is then
-- added as a member in application code, in the same transaction/RPC)
create policy "members can view their household"
  on households for select
  using (is_household_member(id));

create policy "authenticated users can create a household"
  on households for insert
  with check (auth.uid() = created_by);

create policy "owners can update their household"
  on households for update
  using (
    exists (
      select 1 from household_members
      where household_id = households.id
        and user_id = auth.uid()
        and role = 'owner'
    )
  );

-- household_members: visible to other members of the same household
create policy "members can view membership list"
  on household_members for select
  using (is_household_member(household_id));

create policy "owners can add members"
  on household_members for insert
  with check (
    -- allow the very first member (the creating owner) OR an existing owner adding someone
    (auth.uid() = user_id and not exists (
      select 1 from household_members hm where hm.household_id = household_members.household_id
    ))
    or exists (
      select 1 from household_members hm
      where hm.household_id = household_members.household_id
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
    )
  );

create policy "owners can remove members"
  on household_members for delete
  using (
    exists (
      select 1 from household_members hm
      where hm.household_id = household_members.household_id
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
    )
  );

-- receipts / assets / maintenance_*: standard household-scoped CRUD
create policy "members can view receipts" on receipts for select
  using (is_household_member(household_id));
create policy "members can insert receipts" on receipts for insert
  with check (is_household_member(household_id) and auth.uid() = uploaded_by);
create policy "members can update receipts" on receipts for update
  using (is_household_member(household_id));
create policy "members can delete receipts" on receipts for delete
  using (is_household_member(household_id));

create policy "members can view assets" on assets for select
  using (is_household_member(household_id));
create policy "members can insert assets" on assets for insert
  with check (is_household_member(household_id) and auth.uid() = created_by);
create policy "members can update assets" on assets for update
  using (is_household_member(household_id));
create policy "members can delete assets" on assets for delete
  using (is_household_member(household_id));

create policy "members can view maintenance" on maintenance_tasks for select
  using (is_household_member(household_id));
create policy "members can insert maintenance" on maintenance_tasks for insert
  with check (is_household_member(household_id) and auth.uid() = created_by);
create policy "members can update maintenance" on maintenance_tasks for update
  using (is_household_member(household_id));
create policy "members can delete maintenance" on maintenance_tasks for delete
  using (is_household_member(household_id));

create policy "members can view maintenance log" on maintenance_log for select
  using (
    exists (
      select 1 from maintenance_tasks mt
      where mt.id = maintenance_log.maintenance_task_id
        and is_household_member(mt.household_id)
    )
  );
create policy "members can insert maintenance log" on maintenance_log for insert
  with check (
    auth.uid() = done_by and exists (
      select 1 from maintenance_tasks mt
      where mt.id = maintenance_log.maintenance_task_id
        and is_household_member(mt.household_id)
    )
  );
