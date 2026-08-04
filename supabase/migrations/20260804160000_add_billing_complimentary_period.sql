alter table public.barbershops
  add column if not exists complimentary_until date,
  add column if not exists complimentary_reason text,
  add column if not exists complimentary_value numeric(10,2) not null default 0
    check (complimentary_value >= 0),
  add column if not exists complimentary_granted_at timestamptz;

create index if not exists idx_barbershops_complimentary_until
  on public.barbershops(complimentary_until)
  where complimentary_until is not null;

revoke update (
  complimentary_until,
  complimentary_reason,
  complimentary_value,
  complimentary_granted_at
) on public.barbershops from authenticated;
