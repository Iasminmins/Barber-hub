do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'catalog_items'
  ) then
    alter publication supabase_realtime add table public.catalog_items;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'plans'
  ) then
    alter publication supabase_realtime add table public.plans;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'subscriptions'
  ) then
    alter publication supabase_realtime add table public.subscriptions;
  end if;
end
$$;

drop policy if exists "catalog_items_insert_reception" on public.catalog_items;
create policy "catalog_items_insert_reception"
on public.catalog_items for insert to authenticated
with check (private.current_barbershop_role(barbershop_id) = 'reception');

drop policy if exists "catalog_items_update_reception" on public.catalog_items;
create policy "catalog_items_update_reception"
on public.catalog_items for update to authenticated
using (private.current_barbershop_role(barbershop_id) = 'reception')
with check (private.current_barbershop_role(barbershop_id) = 'reception');

drop policy if exists "catalog_items_delete_reception" on public.catalog_items;
create policy "catalog_items_delete_reception"
on public.catalog_items for delete to authenticated
using (private.current_barbershop_role(barbershop_id) = 'reception');

drop policy if exists "plans_insert_reception" on public.plans;
create policy "plans_insert_reception"
on public.plans for insert to authenticated
with check (private.current_barbershop_role(barbershop_id) = 'reception');

drop policy if exists "plans_update_reception" on public.plans;
create policy "plans_update_reception"
on public.plans for update to authenticated
using (private.current_barbershop_role(barbershop_id) = 'reception')
with check (private.current_barbershop_role(barbershop_id) = 'reception');

drop policy if exists "plans_delete_reception" on public.plans;
create policy "plans_delete_reception"
on public.plans for delete to authenticated
using (private.current_barbershop_role(barbershop_id) = 'reception');

drop policy if exists "subscriptions_insert_reception" on public.subscriptions;
create policy "subscriptions_insert_reception"
on public.subscriptions for insert to authenticated
with check (private.current_barbershop_role(barbershop_id) = 'reception');

drop policy if exists "subscriptions_update_reception" on public.subscriptions;
create policy "subscriptions_update_reception"
on public.subscriptions for update to authenticated
using (private.current_barbershop_role(barbershop_id) = 'reception')
with check (private.current_barbershop_role(barbershop_id) = 'reception');

drop policy if exists "subscriptions_delete_reception" on public.subscriptions;
create policy "subscriptions_delete_reception"
on public.subscriptions for delete to authenticated
using (private.current_barbershop_role(barbershop_id) = 'reception');

drop policy if exists "financial_entries_insert_reception_orders" on public.financial_entries;
create policy "financial_entries_insert_reception_orders"
on public.financial_entries for insert to authenticated
with check (
  private.current_barbershop_role(barbershop_id) = 'reception'
  and category in ('Comandas', 'Assinaturas')
  and type = 'entrada'
  and order_id is not null
  and exists (
    select 1 from public.orders
    where orders.id = financial_entries.order_id
      and orders.barbershop_id = financial_entries.barbershop_id
  )
);
