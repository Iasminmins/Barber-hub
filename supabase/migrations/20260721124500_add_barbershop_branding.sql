alter table public.barbershops
add column if not exists logo_url text;

grant update (name, slug, color, city, billing_document, logo_url) on public.barbershops to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'barbershop-assets',
  'barbershop-assets',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists barbershop_assets_public_read on storage.objects;
create policy barbershop_assets_public_read
on storage.objects
for select
to public
using (bucket_id = 'barbershop-assets');

drop policy if exists barbershop_assets_insert_own on storage.objects;
create policy barbershop_assets_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'barbershop-assets'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and private.user_has_barbershop_access(((storage.foldername(name))[1])::uuid)
);

drop policy if exists barbershop_assets_update_own on storage.objects;
create policy barbershop_assets_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'barbershop-assets'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and private.user_has_barbershop_access(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'barbershop-assets'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and private.user_has_barbershop_access(((storage.foldername(name))[1])::uuid)
);

drop policy if exists barbershop_assets_delete_own on storage.objects;
create policy barbershop_assets_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'barbershop-assets'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and private.user_has_barbershop_access(((storage.foldername(name))[1])::uuid)
);
