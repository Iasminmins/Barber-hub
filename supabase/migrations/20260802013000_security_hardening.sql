-- Restringe alterações da empresa a funções administrativas.
drop policy if exists "barbershops_update_own" on public.barbershops;
create policy "barbershops_update_management"
on public.barbershops for update
to authenticated
using (private.current_barbershop_role(id) in ('owner', 'manager'))
with check (private.current_barbershop_role(id) in ('owner', 'manager'));

-- Identificadores de cobrança são mantidos exclusivamente pelas rotas de servidor.
revoke update (asaas_customer_id, asaas_subscription_id, next_billing_date)
on public.barbershops from authenticated;

-- Funcionários comuns só podem bloquear a própria agenda.
drop policy if exists "schedule_blocks_manage_own_barbershop" on public.schedule_blocks;
create policy "schedule_blocks_manage_by_role"
on public.schedule_blocks for all
to authenticated
using (
  private.current_barbershop_role(barbershop_id) in ('owner', 'manager', 'reception')
  or (
    private.current_barbershop_role(barbershop_id) = 'barber'
    and employee_id = private.current_employee_id(barbershop_id)
  )
)
with check (
  exists (
    select 1 from public.employees e
    where e.id = schedule_blocks.employee_id
      and e.barbershop_id = schedule_blocks.barbershop_id
  )
  and (
    private.current_barbershop_role(barbershop_id) in ('owner', 'manager', 'reception')
    or (
      private.current_barbershop_role(barbershop_id) = 'barber'
      and employee_id = private.current_employee_id(barbershop_id)
    )
  )
);

-- O bucket continua público por URL, mas não permite enumerar todos os arquivos.
drop policy if exists "barbershop_assets_public_read" on storage.objects;

-- Funções de trigger não precisam ser chamadas pela API.
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Mantém o agendamento anônimo, mas impede adulteração de clientes existentes,
-- entradas grandes e repetições rápidas para o mesmo telefone.
create or replace function public.create_public_appointment(
  p_slug text, p_service_id uuid, p_date date, p_start time,
  p_client_name text, p_phone text, p_notes text default null, p_employee_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_shop public.barbershops%rowtype;
  target_service public.catalog_items%rowtype;
  target_employee public.employees%rowtype;
  target_client public.clients%rowtype;
  clean_name text := trim(p_client_name);
  clean_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  clean_notes text := nullif(trim(coalesce(p_notes, '')), '');
  created_appointment uuid;
begin
  if char_length(clean_name) < 2 or char_length(clean_name) > 100 then
    raise exception 'Informe um nome entre 2 e 100 caracteres.';
  end if;
  if char_length(clean_phone) < 10 or char_length(clean_phone) > 13 then
    raise exception 'Informe um telefone válido com DDD.';
  end if;
  if clean_notes is not null and char_length(clean_notes) > 500 then
    raise exception 'A observação deve ter no máximo 500 caracteres.';
  end if;
  if p_date < current_date or p_date > current_date + 60 or (p_date + p_start) <= now() then
    raise exception 'Escolha uma data e um horário futuros.';
  end if;

  select * into target_shop
  from public.barbershops
  where lower(trim(slug)) = lower(trim(p_slug));
  if target_shop.id is null then raise exception 'Barbearia não encontrada.'; end if;

  select * into target_service
  from public.catalog_items
  where id = p_service_id
    and barbershop_id = target_shop.id
    and type = 'servico'
    and active = true;
  if target_service.id is null then raise exception 'Serviço indisponível.'; end if;

  perform pg_advisory_xact_lock(hashtext(target_shop.id::text || p_date::text || p_start::text));

  select * into target_client
  from public.clients c
  where c.barbershop_id = target_shop.id
    and regexp_replace(coalesce(c.phone, ''), '\D', '', 'g') = clean_phone
  order by c.created_at
  limit 1;

  if target_client.id is not null and exists (
    select 1
    from public.appointments a
    where a.barbershop_id = target_shop.id
      and a.client_id = target_client.id
      and a.status <> 'cancelado'
      and a.created_at > now() - interval '10 minutes'
  ) then
    raise exception 'Já existe uma solicitação recente para este telefone. Aguarde alguns minutos.';
  end if;

  select e.* into target_employee
  from public.employees e
  where e.barbershop_id = target_shop.id
    and e.active = true
    and (lower(e.role) = 'barber' or lower(e.role) like '%barbeiro%')
    and (p_employee_id is null or e.id = p_employee_id)
    and not exists (
      select 1 from public.schedule_blocks sb
      where sb.employee_id = e.id and sb.date = p_date
    )
    and not exists (
      select 1 from public.appointments a
      where a.employee_id = e.id
        and a.date = p_date
        and a.status <> 'cancelado'
        and a.start < (p_start + make_interval(mins => coalesce(target_service.duration_min, 40)))
        and (a.start + make_interval(mins => a.duration_min)) > p_start
    )
  order by e.name
  limit 1;
  if target_employee.id is null then
    raise exception 'Este horário está indisponível para o profissional escolhido.';
  end if;

  if target_client.id is null then
    insert into public.clients (barbershop_id, name, phone)
    values (target_shop.id, clean_name, clean_phone)
    returning * into target_client;
  end if;

  insert into public.appointments (
    barbershop_id, client_id, employee_id, service_id, client_name, employee_name,
    service_name, date, start, duration_min, status, price, notes
  ) values (
    target_shop.id, target_client.id, target_employee.id, target_service.id, clean_name,
    target_employee.name, target_service.name, p_date, p_start,
    coalesce(target_service.duration_min, 40), 'agendado', target_service.price, clean_notes
  ) returning id into created_appointment;

  return jsonb_build_object(
    'appointmentId', created_appointment,
    'barbershopName', target_shop.name,
    'serviceName', target_service.name,
    'employeeName', target_employee.name,
    'date', p_date,
    'start', to_char(p_start, 'HH24:MI')
  );
end;
$$;

revoke all on function public.create_public_appointment(text, uuid, date, time, text, text, text, uuid) from public;
grant execute on function public.create_public_appointment(text, uuid, date, time, text, text, text, uuid) to anon, authenticated;
