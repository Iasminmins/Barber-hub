alter table public.plans
add column if not exists rules jsonb not null default '{"cycle":"mensal","cycleDays":30,"includedServices":[]}'::jsonb;
