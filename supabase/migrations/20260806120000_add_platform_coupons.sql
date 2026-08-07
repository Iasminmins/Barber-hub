-- Módulo de cupons e cortesias da plataforma (gestão manual — não integra com checkout/Asaas).

create table if not exists public.platform_coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(12,2) not null check (discount_value > 0),
  applicable_plans text[] not null default '{}',
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  redemptions_count integer not null default 0,
  starts_at date,
  expires_at date,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_by_admin_id uuid,
  created_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.platform_coupons(id) on delete cascade,
  barbershop_id uuid references public.barbershops(id) on delete set null,
  barbershop_name text not null,
  discount_applied numeric(12,2),
  note text,
  redeemed_by_admin_id uuid,
  redeemed_by_email text,
  redeemed_at timestamptz not null default now()
);

create index if not exists idx_platform_coupons_status on public.platform_coupons(status);
create index if not exists idx_platform_coupon_redemptions_coupon on public.platform_coupon_redemptions(coupon_id);
create index if not exists idx_platform_coupon_redemptions_shop on public.platform_coupon_redemptions(barbershop_id);

alter table public.platform_coupons enable row level security;
alter table public.platform_coupon_redemptions enable row level security;

revoke all on public.platform_coupons from anon, authenticated;
revoke all on public.platform_coupon_redemptions from anon, authenticated;

grant all on public.platform_coupons to service_role;
grant all on public.platform_coupon_redemptions to service_role;
