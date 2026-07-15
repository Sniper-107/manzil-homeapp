-- Manzil: per-user language preference (tied to the person, not the device)

create table user_preferences (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  language    text not null default 'en' check (language in ('en', 'ar')),
  updated_at  timestamptz not null default now()
);

alter table user_preferences enable row level security;

create policy "users can view their own preferences" on user_preferences for select
  using (auth.uid() = user_id);
create policy "users can insert their own preferences" on user_preferences for insert
  with check (auth.uid() = user_id);
create policy "users can update their own preferences" on user_preferences for update
  using (auth.uid() = user_id);

create trigger trg_user_preferences_updated_at
  before update on user_preferences
  for each row execute function set_updated_at();
