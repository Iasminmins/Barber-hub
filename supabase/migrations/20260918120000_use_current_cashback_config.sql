create or replace function public.award_order_cashback()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  redeemed numeric(12,2) := greatest(coalesce(new.cashback_redeemed, 0), 0);
  cashback_config jsonb;
  cashback_enabled boolean := false;
  percentage numeric := 0;
  minimum_purchase numeric := 0;
  earned numeric(12,2) := 0;
begin
  if pg_trigger_depth() = 1 and new.status = 'paga' and not coalesce(new.cashback_awarded, false) then
    if redeemed > greatest(coalesce(new.total, 0), 0) then
      raise exception 'O cashback utilizado não pode ser maior que o total da comanda.';
    end if;
    if redeemed > 0 and new.client_id is null then
      raise exception 'Uma comanda com cashback utilizado precisa estar vinculada a um cliente.';
    end if;

    -- A configuração atual é a fonte de verdade. O valor enviado pelo navegador
    -- não pode preservar uma porcentagem antiga de quando a comanda foi aberta.
    new.cashback_earned := 0;
    if new.client_id is not null and greatest(coalesce(new.total, 0), 0) > 0 then
      select public_booking_settings->'cashback'
      into cashback_config
      from public.barbershops
      where id = new.barbershop_id;

      cashback_enabled := coalesce((cashback_config->>'enabled')::boolean, false);
      percentage := greatest(coalesce((cashback_config->>'percentage')::numeric, 0), 0);
      minimum_purchase := greatest(coalesce((cashback_config->>'minimumPurchase')::numeric, 0), 0);

      if cashback_enabled and new.total >= minimum_purchase and percentage > 0 then
        earned := round(new.total * percentage / 100, 2);
        new.cashback_earned := earned;
      end if;
    end if;

    if new.client_id is not null and redeemed > 0 then
      update public.clients
      set cashback_balance = cashback_balance - redeemed
      where id = new.client_id
        and cashback_balance >= redeemed;

      if not found then
        raise exception 'O saldo de cashback do cliente é insuficiente.';
      end if;
    end if;

    if new.client_id is not null and new.cashback_earned > 0 then
      update public.clients
      set cashback_balance = cashback_balance + new.cashback_earned
      where id = new.client_id;
    end if;

    new.cashback_awarded := true;
  end if;
  return new;
end;
$$;

drop trigger if exists award_order_cashback_on_paid on public.orders;
create trigger award_order_cashback_on_paid
before insert or update of status on public.orders
for each row execute function public.award_order_cashback();
