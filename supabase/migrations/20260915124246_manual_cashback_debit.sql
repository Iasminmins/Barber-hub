create or replace function public.redeem_client_cashback(p_client_id uuid, p_amount numeric)
returns numeric
language plpgsql
security invoker
set search_path = public
as $$
declare
  amount numeric(12,2) := round(coalesce(p_amount, 0), 2);
  remaining numeric(12,2);
begin
  if amount <= 0 then
    raise exception 'Informe um valor de cashback maior que zero.';
  end if;

  update public.clients
  set cashback_balance = cashback_balance - amount
  where id = p_client_id
    and cashback_balance >= amount
  returning cashback_balance into remaining;

  if not found then
    raise exception 'Saldo de cashback insuficiente ou cliente não encontrado.';
  end if;

  return remaining;
end;
$$;

revoke all on function public.redeem_client_cashback(uuid, numeric) from public;
grant execute on function public.redeem_client_cashback(uuid, numeric) to authenticated;
