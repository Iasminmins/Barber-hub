create or replace function private.current_barbershop_role(target_barbershop_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.members
  where barbershop_id = target_barbershop_id
    and user_id = (select auth.uid())
    and active = true
  limit 1;
$$;

revoke all on function private.current_barbershop_role(uuid) from public, anon;
grant execute on function private.current_barbershop_role(uuid) to authenticated;

-- Dados administrativos: somente proprietário e gerente alteram.
do $$
declare table_name text;
begin
  foreach table_name in array array['employees','catalog_items','plans','subscriptions','financial_entries','commissions','import_records'] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_manage_own_barbershop', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (private.user_has_barbershop_access(barbershop_id))', table_name || '_select_own', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (private.current_barbershop_role(barbershop_id) in (''owner'',''manager''))', table_name || '_insert_manager', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (private.current_barbershop_role(barbershop_id) in (''owner'',''manager'')) with check (private.current_barbershop_role(barbershop_id) in (''owner'',''manager''))', table_name || '_update_manager', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (private.current_barbershop_role(barbershop_id) in (''owner'',''manager''))', table_name || '_delete_manager', table_name);
  end loop;
end $$;

-- Operação diária: recepção também pode operar clientes, agenda e comandas.
do $$
declare table_name text;
begin
  foreach table_name in array array['clients','appointments','orders','order_items'] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_manage_own_barbershop', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (private.user_has_barbershop_access(barbershop_id))', table_name || '_select_own', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (private.current_barbershop_role(barbershop_id) in (''owner'',''manager'',''reception''))', table_name || '_insert_staff', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (private.current_barbershop_role(barbershop_id) in (''owner'',''manager'',''reception'')) with check (private.current_barbershop_role(barbershop_id) in (''owner'',''manager'',''reception''))', table_name || '_update_staff', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using (private.current_barbershop_role(barbershop_id) in (''owner'',''manager''))', table_name || '_delete_manager', table_name);
  end loop;
end $$;

