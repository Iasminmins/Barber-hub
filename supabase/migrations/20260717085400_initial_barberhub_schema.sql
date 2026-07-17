create extension if not exists "pgcrypto";

create table if not exists public.barbershops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  color text not null default '#1E3A32',
  city text,
  plan text not null default 'starter' check (plan in ('starter', 'pro', 'premium')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'owner' check (role in ('owner', 'manager', 'barber', 'reception')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (barbershop_id, user_id)
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  birth_date date,
  address text,
  notes text,
  tags text[] not null default '{}',
  total_spent numeric(12,2) not null default 0,
  visits integer not null default 0,
  last_visit date,
  favorite_service text,
  preferred_barber text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  name text not null,
  role text not null,
  phone text,
  email text,
  active boolean not null default true,
  service_commission numeric(5,2) not null default 0,
  product_commission numeric(5,2) not null default 0,
  subscription_commission numeric(5,2) not null default 0,
  avatar_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  type text not null check (type in ('produto', 'servico')),
  name text not null,
  category text,
  price numeric(12,2) not null default 0,
  cost numeric(12,2) not null default 0,
  duration_min integer,
  stock integer,
  min_stock integer,
  commission numeric(5,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  employee_id uuid references public.employees(id) on delete set null,
  service_id uuid references public.catalog_items(id) on delete set null,
  client_name text not null,
  employee_name text not null,
  service_name text not null,
  date date not null,
  start time not null,
  duration_min integer not null default 40,
  status text not null check (status in ('agendado', 'confirmado', 'chegou', 'concluido', 'cancelado', 'faltou')),
  price numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  number integer not null,
  client_id uuid references public.clients(id) on delete set null,
  client_name text not null,
  employee_id uuid references public.employees(id) on delete set null,
  employee_name text not null,
  discount numeric(12,2) not null default 0,
  surcharge numeric(12,2) not null default 0,
  status text not null check (status in ('aberta', 'paga', 'pendente', 'cancelada')),
  method text check (method in ('dinheiro', 'pix', 'credito', 'debito', 'outro')),
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (barbershop_id, number)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  ref_id uuid,
  type text not null check (type in ('produto', 'servico')),
  name text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  name text not null,
  price numeric(12,2) not null default 0,
  type text not null check (type in ('mensal', 'pacote', 'creditos')),
  credits integer,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  plan_name text not null,
  client_name text not null,
  price numeric(12,2) not null default 0,
  start_date date not null,
  due_date date not null,
  status text not null check (status in ('ativo', 'vencendo', 'vencido', 'cancelado')),
  credits_used integer,
  credits_total integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  type text not null check (type in ('entrada', 'saida')),
  category text not null,
  description text not null,
  amount numeric(12,2) not null default 0,
  method text check (method in ('dinheiro', 'pix', 'credito', 'debito', 'outro')),
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete set null,
  employee_name text not null,
  origin text not null check (origin in ('servico', 'produto', 'assinatura')),
  reference text not null,
  base numeric(12,2) not null default 0,
  rate numeric(5,2) not null default 0,
  amount numeric(12,2) not null default 0,
  status text not null check (status in ('pendente', 'paga')),
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_records (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  entity text not null check (entity in ('clientes', 'produtos', 'servicos', 'funcionarios', 'assinaturas', 'comandas')),
  file_name text not null,
  total_rows integer not null default 0,
  imported_rows integer not null default 0,
  error_rows integer not null default 0,
  status text not null check (status in ('concluida', 'com_erros', 'processando', 'desfeita')),
  created_by text not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.user_has_barbershop_access(target_barbershop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.members
    where members.barbershop_id = target_barbershop_id
      and members.user_id = auth.uid()
      and members.active = true
  );
$$;

create index if not exists idx_members_user_id on public.members(user_id);
create index if not exists idx_members_barbershop_id on public.members(barbershop_id);
create index if not exists idx_clients_barbershop_id on public.clients(barbershop_id);
create index if not exists idx_employees_barbershop_id on public.employees(barbershop_id);
create index if not exists idx_catalog_items_barbershop_id on public.catalog_items(barbershop_id);
create index if not exists idx_catalog_items_type on public.catalog_items(type);
create index if not exists idx_appointments_barbershop_date on public.appointments(barbershop_id, date);
create index if not exists idx_appointments_employee_date_start on public.appointments(employee_id, date, start);
create index if not exists idx_orders_barbershop_created_at on public.orders(barbershop_id, created_at);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_barbershop_id on public.order_items(barbershop_id);
create index if not exists idx_plans_barbershop_id on public.plans(barbershop_id);
create index if not exists idx_subscriptions_barbershop_due_date on public.subscriptions(barbershop_id, due_date);
create index if not exists idx_financial_entries_barbershop_date on public.financial_entries(barbershop_id, date);
create index if not exists idx_commissions_barbershop_date on public.commissions(barbershop_id, date);
create index if not exists idx_import_records_barbershop_created_at on public.import_records(barbershop_id, created_at);

drop trigger if exists set_barbershops_updated_at on public.barbershops;
create trigger set_barbershops_updated_at
before update on public.barbershops
for each row execute function public.set_updated_at();

drop trigger if exists set_members_updated_at on public.members;
create trigger set_members_updated_at
before update on public.members
for each row execute function public.set_updated_at();

drop trigger if exists set_clients_updated_at on public.clients;
create trigger set_clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists set_employees_updated_at on public.employees;
create trigger set_employees_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

drop trigger if exists set_catalog_items_updated_at on public.catalog_items;
create trigger set_catalog_items_updated_at
before update on public.catalog_items
for each row execute function public.set_updated_at();

drop trigger if exists set_appointments_updated_at on public.appointments;
create trigger set_appointments_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists set_plans_updated_at on public.plans;
create trigger set_plans_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists set_financial_entries_updated_at on public.financial_entries;
create trigger set_financial_entries_updated_at
before update on public.financial_entries
for each row execute function public.set_updated_at();

drop trigger if exists set_commissions_updated_at on public.commissions;
create trigger set_commissions_updated_at
before update on public.commissions
for each row execute function public.set_updated_at();

alter table public.barbershops enable row level security;
alter table public.members enable row level security;
alter table public.clients enable row level security;
alter table public.employees enable row level security;
alter table public.catalog_items enable row level security;
alter table public.appointments enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.financial_entries enable row level security;
alter table public.commissions enable row level security;
alter table public.import_records enable row level security;

create policy "barbershops_select_own"
on public.barbershops for select
using (public.user_has_barbershop_access(id));

create policy "barbershops_update_own"
on public.barbershops for update
using (public.user_has_barbershop_access(id))
with check (public.user_has_barbershop_access(id));

create policy "members_select_same_barbershop"
on public.members for select
using (public.user_has_barbershop_access(barbershop_id));

create policy "members_manage_owner"
on public.members for all
using (
  exists (
    select 1 from public.members owner_member
    where owner_member.barbershop_id = members.barbershop_id
      and owner_member.user_id = auth.uid()
      and owner_member.role = 'owner'
      and owner_member.active = true
  )
)
with check (
  exists (
    select 1 from public.members owner_member
    where owner_member.barbershop_id = members.barbershop_id
      and owner_member.user_id = auth.uid()
      and owner_member.role = 'owner'
      and owner_member.active = true
  )
);

create policy "clients_manage_own_barbershop"
on public.clients for all
using (public.user_has_barbershop_access(barbershop_id))
with check (public.user_has_barbershop_access(barbershop_id));

create policy "employees_manage_own_barbershop"
on public.employees for all
using (public.user_has_barbershop_access(barbershop_id))
with check (public.user_has_barbershop_access(barbershop_id));

create policy "catalog_items_manage_own_barbershop"
on public.catalog_items for all
using (public.user_has_barbershop_access(barbershop_id))
with check (public.user_has_barbershop_access(barbershop_id));

create policy "appointments_manage_own_barbershop"
on public.appointments for all
using (public.user_has_barbershop_access(barbershop_id))
with check (public.user_has_barbershop_access(barbershop_id));

create policy "orders_manage_own_barbershop"
on public.orders for all
using (public.user_has_barbershop_access(barbershop_id))
with check (public.user_has_barbershop_access(barbershop_id));

create policy "order_items_manage_own_barbershop"
on public.order_items for all
using (public.user_has_barbershop_access(barbershop_id))
with check (public.user_has_barbershop_access(barbershop_id));

create policy "plans_manage_own_barbershop"
on public.plans for all
using (public.user_has_barbershop_access(barbershop_id))
with check (public.user_has_barbershop_access(barbershop_id));

create policy "subscriptions_manage_own_barbershop"
on public.subscriptions for all
using (public.user_has_barbershop_access(barbershop_id))
with check (public.user_has_barbershop_access(barbershop_id));

create policy "financial_entries_manage_own_barbershop"
on public.financial_entries for all
using (public.user_has_barbershop_access(barbershop_id))
with check (public.user_has_barbershop_access(barbershop_id));

create policy "commissions_manage_own_barbershop"
on public.commissions for all
using (public.user_has_barbershop_access(barbershop_id))
with check (public.user_has_barbershop_access(barbershop_id));

create policy "import_records_manage_own_barbershop"
on public.import_records for all
using (public.user_has_barbershop_access(barbershop_id))
with check (public.user_has_barbershop_access(barbershop_id));
