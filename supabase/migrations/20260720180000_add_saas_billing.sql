alter table public.barbershops
  add column if not exists billing_status text not null default 'trialing'
    check (billing_status in ('trialing', 'active', 'past_due', 'canceled')),
  add column if not exists trial_ends_at timestamptz not null default (now() + interval '30 days'),
  add column if not exists asaas_customer_id text,
  add column if not exists asaas_subscription_id text,
  add column if not exists next_billing_date date,
  add column if not exists last_payment_at timestamptz;

update public.barbershops
set trial_ends_at = created_at + interval '30 days'
where billing_status = 'trialing';

create unique index if not exists idx_barbershops_asaas_customer
  on public.barbershops(asaas_customer_id)
  where asaas_customer_id is not null;

create unique index if not exists idx_barbershops_asaas_subscription
  on public.barbershops(asaas_subscription_id)
  where asaas_subscription_id is not null;

-- O navegador so pode alterar os dados comuns da empresa. Plano e cobranca
-- sao atualizados exclusivamente pelas rotas seguras e pelo webhook.
revoke update on public.barbershops from authenticated;
grant update (name, slug, color, city) on public.barbershops to authenticated;

grant select on public.barbershops to authenticated;
