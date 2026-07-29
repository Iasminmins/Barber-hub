alter table public.subscriptions
  add column if not exists employee_id uuid references public.employees(id) on delete set null,
  add column if not exists employee_name text;

create index if not exists idx_subscriptions_employee_id
  on public.subscriptions(employee_id);

