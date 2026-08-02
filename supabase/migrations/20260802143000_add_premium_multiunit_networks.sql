-- Agrupa unidades Premium sob uma unica assinatura/rede.
create table if not exists public.networks (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 100),
  primary_barbershop_id uuid not null unique references public.barbershops(id) on delete restrict,
  max_units integer not null default 3 check (max_units between 1 and 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.barbershops
  add column if not exists network_id uuid references public.networks(id) on delete set null;

create index if not exists idx_barbershops_network_id on public.barbershops(network_id);

create table if not exists public.network_members (
  network_id uuid not null references public.networks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager')),
  created_at timestamptz not null default now(),
  primary key (network_id, user_id)
);

create index if not exists idx_network_members_user_id on public.network_members(user_id);

-- Cada conta Premium existente passa a ser a unidade principal de sua propria rede.
insert into public.networks (name, primary_barbershop_id)
select b.name, b.id
from public.barbershops b
where b.plan = 'premium'
  and not exists (select 1 from public.networks n where n.primary_barbershop_id = b.id);

update public.barbershops b
set network_id = n.id
from public.networks n
where n.primary_barbershop_id = b.id
  and b.network_id is null;

insert into public.network_members (network_id, user_id, role)
select distinct b.network_id, m.user_id, 'owner'
from public.barbershops b
join public.members m on m.barbershop_id = b.id and m.role = 'owner' and m.active = true
where b.network_id is not null
on conflict (network_id, user_id) do nothing;

alter table public.networks enable row level security;
alter table public.network_members enable row level security;

drop policy if exists "networks_select_member" on public.networks;
create policy "networks_select_member"
on public.networks for select
to authenticated
using (
  exists (
    select 1 from public.network_members nm
    where nm.network_id = networks.id
      and nm.user_id = (select auth.uid())
  )
);

drop policy if exists "network_members_select_self" on public.network_members;
create policy "network_members_select_self"
on public.network_members for select
to authenticated
using (user_id = (select auth.uid()));

-- Mutacoes passam somente pelas rotas autenticadas do servidor.
grant select on public.networks, public.network_members to authenticated;
revoke insert, update, delete on public.networks, public.network_members from anon, authenticated;

drop trigger if exists set_networks_updated_at on public.networks;
create trigger set_networks_updated_at
before update on public.networks
for each row execute function public.set_updated_at();

-- A API precisa enxergar a nova coluna, mas clientes nao podem mover unidades entre redes.
grant select (network_id) on public.barbershops to authenticated;
revoke update (network_id) on public.barbershops from authenticated;
