alter table public.barbershops
  add column if not exists public_booking_settings jsonb not null default '{"productIds":[],"showCashback":false,"cashback":{"enabled":false,"percentage":5,"minimumPurchase":0}}'::jsonb;

alter table public.appointments
  add column if not exists selected_products jsonb not null default '[]'::jsonb,
  add column if not exists referral_name text,
  add column if not exists referral_phone text;

alter table public.clients
  add column if not exists cashback_balance numeric(12,2) not null default 0;

alter table public.orders
  add column if not exists cashback_earned numeric(12,2) not null default 0,
  add column if not exists cashback_awarded boolean not null default false;

create or replace function public.award_order_cashback()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if pg_trigger_depth() = 1 and new.status = 'paga' and not new.cashback_awarded and new.cashback_earned > 0 and new.client_id is not null then
    update public.clients set cashback_balance = cashback_balance + new.cashback_earned where id = new.client_id;
    new.cashback_awarded := true;
  end if;
  return new;
end;
$$;

drop trigger if exists award_order_cashback_on_paid on public.orders;
create trigger award_order_cashback_on_paid
before insert or update of status on public.orders
for each row execute function public.award_order_cashback();

create or replace function public.get_public_booking_page(p_slug text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'barbershop', jsonb_build_object(
      'name', b.name,
      'slug', b.slug,
      'city', coalesce(b.city, ''),
      'color', b.color,
      'logoUrl', coalesce(b.logo_url, '')
    ),
    'services', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'category', coalesce(c.category, ''),
        'price', c.price,
        'durationMin', coalesce(c.duration_min, 40)
      ) order by c.name)
      from public.catalog_items c
      where c.barbershop_id = b.id and c.type = 'servico' and c.active = true
    ), '[]'::jsonb),
    'employees', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', e.id,
        'name', e.name,
        'avatarUrl', coalesce(e.avatar_url, '')
      ) order by e.name)
      from public.employees e
      where e.barbershop_id = b.id
        and e.active = true
        and (lower(e.role) = 'barber' or lower(e.role) like '%barbeiro%')
    ), '[]'::jsonb),
    'products', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id,
        'name', c.name,
        'category', coalesce(c.category, ''),
        'price', c.price,
        'stock', c.stock
      ) order by c.name)
      from public.catalog_items c
      where c.barbershop_id = b.id
        and c.type = 'produto'
        and c.active = true
        and (c.stock is null or c.stock > 0)
        and c.id::text in (
          select jsonb_array_elements_text(coalesce(b.public_booking_settings->'productIds', '[]'::jsonb))
        )
    ), '[]'::jsonb),
    'publicBooking', jsonb_build_object(
      'showCashback', coalesce((b.public_booking_settings->>'showCashback')::boolean, false),
      'cashback', jsonb_build_object(
        'enabled', coalesce((b.public_booking_settings->'cashback'->>'enabled')::boolean, false),
        'percentage', coalesce((b.public_booking_settings->'cashback'->>'percentage')::numeric, 5),
        'minimumPurchase', coalesce((b.public_booking_settings->'cashback'->>'minimumPurchase')::numeric, 0)
      )
    )
  )
  from public.barbershops b
  where lower(trim(b.slug)) = lower(trim(p_slug))
  limit 1;
$$;

drop function if exists public.create_public_appointment(text, uuid, date, time, text, text, text, uuid);
drop function if exists public.create_public_appointment(text, uuid, date, time, text, text, text, uuid, uuid[], text, text);

create or replace function public.create_public_appointment(
  p_slug text,
  p_service_id uuid,
  p_date date,
  p_start time,
  p_client_name text,
  p_phone text,
  p_notes text default null,
  p_employee_id uuid default null,
  p_product_ids uuid[] default '{}',
  p_product_quantities jsonb default '{}'::jsonb,
  p_referral_name text default null,
  p_referral_phone text default null
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
  clean_referral_name text := nullif(trim(coalesce(p_referral_name, '')), '');
  clean_referral_phone text := nullif(regexp_replace(coalesce(p_referral_phone, ''), '\D', '', 'g'), '');
  created_appointment uuid;
  selected_products jsonb;
begin
  if char_length(clean_name) < 2 or char_length(clean_name) > 100 then raise exception 'Informe um nome entre 2 e 100 caracteres.'; end if;
  if char_length(clean_phone) < 10 or char_length(clean_phone) > 13 then raise exception 'Informe um telefone válido com DDD.'; end if;
  if clean_referral_name is not null and (clean_referral_phone is null or char_length(clean_referral_phone) < 10 or char_length(clean_referral_phone) > 13) then raise exception 'Informe um telefone válido para o amigo indicado.'; end if;
  if clean_referral_phone is not null and clean_referral_name is null then raise exception 'Informe o nome do amigo indicado.'; end if;
  if clean_notes is not null and char_length(clean_notes) > 500 then raise exception 'A observação deve ter no máximo 500 caracteres.'; end if;
  if p_date < current_date or p_date > current_date + 60 or (p_date + p_start) <= now() then raise exception 'Escolha uma data e um horário futuros.'; end if;

  select * into target_shop from public.barbershops where lower(trim(slug)) = lower(trim(p_slug));
  if target_shop.id is null then raise exception 'Barbearia não encontrada.'; end if;
  select * into target_service from public.catalog_items where id = p_service_id and barbershop_id = target_shop.id and type = 'servico' and active = true;
  if target_service.id is null then raise exception 'Serviço indisponível.'; end if;

  if exists (
    select 1 from unnest(coalesce(p_product_ids, '{}')) requested(id)
    where not exists (
      select 1 from public.catalog_items c
      where c.id = requested.id and c.barbershop_id = target_shop.id and c.type = 'produto' and c.active = true
        and (c.stock is null or c.stock > 0)
        and c.id::text in (select jsonb_array_elements_text(coalesce(target_shop.public_booking_settings->'productIds', '[]'::jsonb)))
    )
  ) then raise exception 'Um dos produtos selecionados não está disponível.'; end if;

  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'quantity', greatest(1, coalesce((p_product_quantities->>c.id::text)::integer, 1)), 'unitPrice', c.price) order by c.name), '[]'::jsonb)
  into selected_products
  from public.catalog_items c
  where c.id = any(coalesce(p_product_ids, '{}')) and c.barbershop_id = target_shop.id;

  perform pg_advisory_xact_lock(hashtext(target_shop.id::text || p_date::text || p_start::text));
  select * into target_client from public.clients c where c.barbershop_id = target_shop.id and regexp_replace(coalesce(c.phone, ''), '\D', '', 'g') = clean_phone order by c.created_at limit 1;
  if target_client.id is not null and exists (select 1 from public.appointments a where a.barbershop_id = target_shop.id and a.client_id = target_client.id and a.status <> 'cancelado' and a.created_at > now() - interval '10 minutes') then raise exception 'Já existe uma solicitação recente para este telefone. Aguarde alguns minutos.'; end if;

  select e.* into target_employee from public.employees e
  where e.barbershop_id = target_shop.id and e.active = true and (lower(e.role) = 'barber' or lower(e.role) like '%barbeiro%')
    and (p_employee_id is null or e.id = p_employee_id)
    and not exists (select 1 from public.schedule_blocks sb where sb.employee_id = e.id and sb.date = p_date)
    and not exists (select 1 from public.appointments a where a.employee_id = e.id and a.date = p_date and a.status <> 'cancelado' and a.start < (p_start + make_interval(mins => coalesce(target_service.duration_min, 40))) and (a.start + make_interval(mins => a.duration_min)) > p_start)
  order by e.name limit 1;
  if target_employee.id is null then raise exception 'Este horário está indisponível para o profissional escolhido.'; end if;

  if target_client.id is null then insert into public.clients (barbershop_id, name, phone) values (target_shop.id, clean_name, clean_phone) returning * into target_client; end if;
  insert into public.appointments (barbershop_id, client_id, employee_id, service_id, client_name, employee_name, service_name, date, start, duration_min, status, price, notes, selected_products, referral_name, referral_phone)
  values (target_shop.id, target_client.id, target_employee.id, target_service.id, clean_name, target_employee.name, target_service.name, p_date, p_start, coalesce(target_service.duration_min, 40), 'agendado', target_service.price, clean_notes, selected_products, clean_referral_name, clean_referral_phone)
  returning id into created_appointment;

  return jsonb_build_object('appointmentId', created_appointment, 'barbershopName', target_shop.name, 'serviceName', target_service.name, 'employeeName', target_employee.name, 'date', p_date, 'start', to_char(p_start, 'HH24:MI'), 'products', selected_products);
end;
$$;

revoke all on function public.get_public_booking_page(text) from public;
grant execute on function public.get_public_booking_page(text) to anon, authenticated;
revoke all on function public.create_public_appointment(text, uuid, date, time, text, text, text, uuid, uuid[], jsonb, text, text) from public;
grant execute on function public.create_public_appointment(text, uuid, date, time, text, text, text, uuid, uuid[], jsonb, text, text) to anon, authenticated;
