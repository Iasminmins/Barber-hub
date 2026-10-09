do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'order_items'
  ) then
    alter publication supabase_realtime add table public.order_items;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'financial_entries'
  ) then
    alter publication supabase_realtime add table public.financial_entries;
  end if;
end
$$;

drop policy if exists "financial_entries_select_reception_orders" on public.financial_entries;
create policy "financial_entries_select_reception_orders"
on public.financial_entries for select
to authenticated
using (
  private.current_barbershop_role(barbershop_id) = 'reception'
  and category = 'Comandas'
  and order_id is not null
);

drop policy if exists "financial_entries_insert_reception_orders" on public.financial_entries;
create policy "financial_entries_insert_reception_orders"
on public.financial_entries for insert
to authenticated
with check (
  private.current_barbershop_role(barbershop_id) = 'reception'
  and category = 'Comandas'
  and type = 'entrada'
  and order_id is not null
  and exists (
    select 1
    from public.orders
    where orders.id = financial_entries.order_id
      and orders.barbershop_id = financial_entries.barbershop_id
  )
);

drop policy if exists "financial_entries_update_reception_orders" on public.financial_entries;
create policy "financial_entries_update_reception_orders"
on public.financial_entries for update
to authenticated
using (
  private.current_barbershop_role(barbershop_id) = 'reception'
  and category = 'Comandas'
  and order_id is not null
)
with check (
  private.current_barbershop_role(barbershop_id) = 'reception'
  and category = 'Comandas'
  and type = 'entrada'
  and order_id is not null
  and exists (
    select 1
    from public.orders
    where orders.id = financial_entries.order_id
      and orders.barbershop_id = financial_entries.barbershop_id
  )
);

drop policy if exists "financial_entries_delete_reception_orders" on public.financial_entries;
create policy "financial_entries_delete_reception_orders"
on public.financial_entries for delete
to authenticated
using (
  private.current_barbershop_role(barbershop_id) = 'reception'
  and category = 'Comandas'
  and order_id is not null
);
