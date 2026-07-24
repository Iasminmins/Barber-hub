alter table public.members
  add column if not exists employee_id uuid references public.employees(id) on delete set null;

create unique index if not exists idx_members_barbershop_employee_unique
  on public.members(barbershop_id, employee_id)
  where employee_id is not null;

create or replace function private.current_employee_id(target_barbershop_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select employee_id
  from public.members
  where barbershop_id = target_barbershop_id
    and user_id = (select auth.uid())
    and active = true
  limit 1;
$$;

revoke all on function private.current_employee_id(uuid) from public, anon;
grant execute on function private.current_employee_id(uuid) to authenticated;

drop policy if exists "members_select_same_barbershop" on public.members;
create policy "members_select_self_or_owner"
on public.members for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.user_is_barbershop_owner(barbershop_id))
);

drop policy if exists "appointments_select_own" on public.appointments;
create policy "appointments_select_by_role"
on public.appointments for select
to authenticated
using (
  private.current_barbershop_role(barbershop_id) in ('owner', 'manager', 'reception')
  or (
    private.current_barbershop_role(barbershop_id) = 'barber'
    and employee_id = private.current_employee_id(barbershop_id)
  )
);

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_by_role"
on public.orders for select
to authenticated
using (
  private.current_barbershop_role(barbershop_id) in ('owner', 'manager', 'reception')
  or (
    private.current_barbershop_role(barbershop_id) = 'barber'
    and employee_id = private.current_employee_id(barbershop_id)
  )
);

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_by_role"
on public.order_items for select
to authenticated
using (
  private.current_barbershop_role(barbershop_id) in ('owner', 'manager', 'reception')
  or (
    private.current_barbershop_role(barbershop_id) = 'barber'
    and exists (
      select 1
      from public.orders
      where orders.id = order_items.order_id
        and orders.employee_id = private.current_employee_id(order_items.barbershop_id)
    )
  )
);

drop policy if exists "commissions_select_own" on public.commissions;
create policy "commissions_select_by_role"
on public.commissions for select
to authenticated
using (
  private.current_barbershop_role(barbershop_id) in ('owner', 'manager')
  or (
    private.current_barbershop_role(barbershop_id) = 'barber'
    and employee_id = private.current_employee_id(barbershop_id)
  )
);

drop policy if exists "financial_entries_select_own" on public.financial_entries;
create policy "financial_entries_select_management"
on public.financial_entries for select
to authenticated
using (private.current_barbershop_role(barbershop_id) in ('owner', 'manager'));

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_staff"
on public.subscriptions for select
to authenticated
using (private.current_barbershop_role(barbershop_id) in ('owner', 'manager', 'reception'));

drop policy if exists "plans_select_own" on public.plans;
create policy "plans_select_staff"
on public.plans for select
to authenticated
using (private.current_barbershop_role(barbershop_id) in ('owner', 'manager', 'reception'));

drop policy if exists "import_records_select_own" on public.import_records;
create policy "import_records_select_management"
on public.import_records for select
to authenticated
using (private.current_barbershop_role(barbershop_id) in ('owner', 'manager'));
