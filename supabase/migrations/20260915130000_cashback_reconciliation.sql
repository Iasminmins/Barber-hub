create or replace function public.reconcile_order_cashback(p_order_id uuid)
returns numeric
language plpgsql
security invoker
set search_path = public
as $$
declare
  target_order public.orders%rowtype;
  earned numeric(12,2) := 0;
  cashback_config jsonb;
  percentage numeric := 0;
  minimum_purchase numeric := 0;
  cashback_enabled boolean := false;
begin
  select * into target_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Comanda não encontrada.';
  end if;
  if target_order.status <> 'paga' then
    raise exception 'Somente comandas pagas podem receber cashback.';
  end if;
  if coalesce(target_order.cashback_awarded, false) then
    return 0;
  end if;

  earned := round(greatest(coalesce(target_order.cashback_earned, 0), 0), 2);
  if earned = 0 and greatest(coalesce(target_order.total, 0), 0) > 0 and target_order.client_id is not null then
    select public_booking_settings->'cashback'
    into cashback_config
    from public.barbershops
    where id = target_order.barbershop_id;

    cashback_enabled := coalesce((cashback_config->>'enabled')::boolean, false);
    percentage := greatest(coalesce((cashback_config->>'percentage')::numeric, 0), 0);
    minimum_purchase := greatest(coalesce((cashback_config->>'minimumPurchase')::numeric, 0), 0);
    if cashback_enabled and target_order.total >= minimum_purchase and percentage > 0 then
      earned := round(target_order.total * percentage / 100, 2);
      update public.orders set cashback_earned = earned where id = target_order.id;
    end if;
  end if;
  if earned = 0 or greatest(coalesce(target_order.total, 0), 0) = 0 or target_order.client_id is null then
    update public.orders
    set cashback_awarded = true
    where id = target_order.id;
    return 0;
  end if;

  update public.clients
  set cashback_balance = cashback_balance + earned
  where id = target_order.client_id;

  if not found then
    raise exception 'Cliente da comanda não encontrado.';
  end if;

  update public.orders
  set cashback_awarded = true
  where id = target_order.id;

  return earned;
end;
$$;

revoke all on function public.reconcile_order_cashback(uuid) from public;
grant execute on function public.reconcile_order_cashback(uuid) to authenticated;
