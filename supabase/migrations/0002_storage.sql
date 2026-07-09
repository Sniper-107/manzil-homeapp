-- Storage bucket for receipt photos.
-- Path convention: receipts/{household_id}/{receipt_id}.jpg
-- This keeps the household_id as the first path segment so the RLS
-- policy below can check membership without a lookup table.

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "members can read their household's receipt photos"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and is_household_member((storage.foldername(name))[1]::uuid)
  );

create policy "members can upload receipt photos for their household"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and is_household_member((storage.foldername(name))[1]::uuid)
  );

create policy "members can delete their household's receipt photos"
  on storage.objects for delete
  using (
    bucket_id = 'receipts'
    and is_household_member((storage.foldername(name))[1]::uuid)
  );
