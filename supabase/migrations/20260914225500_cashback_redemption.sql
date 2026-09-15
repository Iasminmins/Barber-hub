alter table public.orders
  add column if not exists cashback_redeemed numeric(12,2) not null default 0;

create or replace function public.award_order_cashback()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  redeemed numeric(12,2) := greatest(coalesce(new.cashback_redeemed, 0), 0);
begin
  if pg_trigger_depth() = 1 and new.status = 'paga' and not coalesce(new.cashback_awarded, false) then
    if redeemed > greatest(coalesce(new.total, 0), 0) then
      raise exception 'O cashback utilizado não pode ser maior que o total da comanda.';
    end if;
    if redeemed > 0 and new.client_id is null then
      raise exception 'Uma comanda com cashback utilizado precisa estar vinculada a um cliente.';
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

    if new.client_id is not null and coalesce(new.cashback_earned, 0) > 0 then
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
