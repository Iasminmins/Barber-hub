alter table public.orders
  add column if not exists appointment_id uuid
  references public.appointments(id) on delete set null;

create index if not exists idx_orders_appointment_id
  on public.orders(appointment_id);

create unique index if not exists idx_orders_unique_appointment
  on public.orders(appointment_id)
  where appointment_id is not null;
