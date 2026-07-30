alter table public.financial_entries
  add column if not exists order_id uuid references public.orders(id) on delete cascade;

create unique index if not exists idx_financial_entries_order_id_unique
  on public.financial_entries(order_id)
  where order_id is not null;
