alter table public.members
  add column if not exists permissions jsonb not null default '["dashboard", "agenda"]'::jsonb;

alter table public.members
  drop constraint if exists members_permissions_is_array;

alter table public.members
  add constraint members_permissions_is_array
  check (jsonb_typeof(permissions) = 'array');
