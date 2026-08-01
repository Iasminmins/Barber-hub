alter table public.employees
add column if not exists avatar_url text;

grant update (avatar_url) on public.employees to authenticated;
