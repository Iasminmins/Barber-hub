create table if not exists public.assistant_usage (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  period text not null check (period ~ '^\d{4}-\d{2}$'),
  used_count integer not null default 0 check (used_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period)
);

create index if not exists idx_assistant_usage_barbershop_id on public.assistant_usage(barbershop_id);
create index if not exists idx_assistant_usage_user_period on public.assistant_usage(user_id, period);

drop trigger if exists set_assistant_usage_updated_at on public.assistant_usage;
create trigger set_assistant_usage_updated_at
before update on public.assistant_usage
for each row execute function public.set_updated_at();

alter table public.assistant_usage enable row level security;

drop policy if exists "assistant_usage_select_self" on public.assistant_usage;
create policy "assistant_usage_select_self"
on public.assistant_usage for select
using (user_id = (select auth.uid()));

revoke all on table public.assistant_usage from anon, authenticated;
grant select on table public.assistant_usage to authenticated;
grant select, insert, update, delete on table public.assistant_usage to service_role;
