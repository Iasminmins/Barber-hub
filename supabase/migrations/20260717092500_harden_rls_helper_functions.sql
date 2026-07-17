create schema if not exists private;

create or replace function private.user_has_barbershop_access(target_barbershop_id uuid)
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
      and members.user_id = (select auth.uid())
      and members.active = true
  );
$$;

revoke all on function private.user_has_barbershop_access(uuid) from public;
revoke all on function private.user_has_barbershop_access(uuid) from anon;
revoke all on function private.user_has_barbershop_access(uuid) from authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop policy if exists "barbershops_select_own" on public.barbershops;
create policy "barbershops_select_own"
on public.barbershops for select
using (private.user_has_barbershop_access(id));

drop policy if exists "barbershops_update_own" on public.barbershops;
create policy "barbershops_update_own"
on public.barbershops for update
using (private.user_has_barbershop_access(id))
with check (private.user_has_barbershop_access(id));

drop policy if exists "members_select_same_barbershop" on public.members;
create policy "members_select_same_barbershop"
on public.members for select
using (private.user_has_barbershop_access(barbershop_id));

drop policy if exists "members_manage_owner" on public.members;
create policy "members_manage_owner"
on public.members for all
using (
  exists (
    select 1 from public.members owner_member
    where owner_member.barbershop_id = members.barbershop_id
      and owner_member.user_id = (select auth.uid())
      and owner_member.role = 'owner'
      and owner_member.active = true
  )
)
with check (
  exists (
    select 1 from public.members owner_member
    where owner_member.barbershop_id = members.barbershop_id
      and owner_member.user_id = (select auth.uid())
      and owner_member.role = 'owner'
      and owner_member.active = true
  )
);

drop policy if exists "clients_manage_own_barbershop" on public.clients;
create policy "clients_manage_own_barbershop"
on public.clients for all
using (private.user_has_barbershop_access(barbershop_id))
with check (private.user_has_barbershop_access(barbershop_id));

drop policy if exists "employees_manage_own_barbershop" on public.employees;
create policy "employees_manage_own_barbershop"
on public.employees for all
using (private.user_has_barbershop_access(barbershop_id))
with check (private.user_has_barbershop_access(barbershop_id));

drop policy if exists "catalog_items_manage_own_barbershop" on public.catalog_items;
create policy "catalog_items_manage_own_barbershop"
on public.catalog_items for all
using (private.user_has_barbershop_access(barbershop_id))
with check (private.user_has_barbershop_access(barbershop_id));

drop policy if exists "appointments_manage_own_barbershop" on public.appointments;
create policy "appointments_manage_own_barbershop"
on public.appointments for all
using (private.user_has_barbershop_access(barbershop_id))
with check (private.user_has_barbershop_access(barbershop_id));

drop policy if exists "orders_manage_own_barbershop" on public.orders;
create policy "orders_manage_own_barbershop"
on public.orders for all
using (private.user_has_barbershop_access(barbershop_id))
with check (private.user_has_barbershop_access(barbershop_id));

drop policy if exists "order_items_manage_own_barbershop" on public.order_items;
create policy "order_items_manage_own_barbershop"
on public.order_items for all
using (private.user_has_barbershop_access(barbershop_id))
with check (private.user_has_barbershop_access(barbershop_id));

drop policy if exists "plans_manage_own_barbershop" on public.plans;
create policy "plans_manage_own_barbershop"
on public.plans for all
using (private.user_has_barbershop_access(barbershop_id))
with check (private.user_has_barbershop_access(barbershop_id));

drop policy if exists "subscriptions_manage_own_barbershop" on public.subscriptions;
create policy "subscriptions_manage_own_barbershop"
on public.subscriptions for all
using (private.user_has_barbershop_access(barbershop_id))
with check (private.user_has_barbershop_access(barbershop_id));

drop policy if exists "financial_entries_manage_own_barbershop" on public.financial_entries;
create policy "financial_entries_manage_own_barbershop"
on public.financial_entries for all
using (private.user_has_barbershop_access(barbershop_id))
with check (private.user_has_barbershop_access(barbershop_id));

drop policy if exists "commissions_manage_own_barbershop" on public.commissions;
create policy "commissions_manage_own_barbershop"
on public.commissions for all
using (private.user_has_barbershop_access(barbershop_id))
with check (private.user_has_barbershop_access(barbershop_id));

drop policy if exists "import_records_manage_own_barbershop" on public.import_records;
create policy "import_records_manage_own_barbershop"
on public.import_records for all
using (private.user_has_barbershop_access(barbershop_id))
with check (private.user_has_barbershop_access(barbershop_id));

drop function if exists public.user_has_barbershop_access(uuid);
