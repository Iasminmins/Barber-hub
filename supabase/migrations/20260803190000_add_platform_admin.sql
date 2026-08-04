-- ============================================================
-- Painel da Plataforma (super-admin do SaaS)
-- Acesso separado do app das barbearias. Somente usuarios
-- listados em platform_admins podem acessar /admin.
-- Nenhuma policy libera leitura para "authenticated": o acesso
-- e feito exclusivamente pelo service_role nas rotas /api/admin.
-- ============================================================

create table if not exists public.platform_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  name text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

revoke all on public.platform_admins from anon, authenticated;

create index if not exists idx_platform_admins_user
  on public.platform_admins(user_id) where active;

-- ============================================================
-- Trilha de auditoria das acoes do super-admin
-- ============================================================
create table if not exists public.platform_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  admin_email text,
  action text not null,
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.platform_audit_log enable row level security;
revoke all on public.platform_audit_log from anon, authenticated;

create index if not exists idx_platform_audit_created
  on public.platform_audit_log(created_at desc);

create index if not exists idx_platform_audit_admin_user
  on public.platform_audit_log(admin_user_id);

-- O painel acessa estas tabelas exclusivamente no servidor.
-- Grants explicitos mantem a migration compativel com projetos
-- que nao expoem novas tabelas automaticamente na Data API.
grant select on public.platform_admins to service_role;
grant select, insert on public.platform_audit_log to service_role;

-- As rotas administrativas globais usam o service_role para ignorar o RLS,
-- mas o papel ainda precisa dos privilegios SQL nas tabelas gerenciadas.
grant select, update, delete on public.barbershops to service_role;
grant select, update on public.members to service_role;

notify pgrst, 'reload schema';

-- ============================================================
-- COMO LIBERAR SEU ACESSO (rode 1x com seu e-mail):
--
-- insert into public.platform_admins (user_id, email, name)
-- select id, email, 'Dono da Plataforma'
-- from auth.users
-- where email = 'SEU-EMAIL@dominio.com'
-- on conflict (user_id) do update set active = true;
-- ============================================================
