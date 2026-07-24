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
      'color', b.color
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
      where c.barbershop_id = b.id
        and c.type = 'servico'
        and c.active = true
    ), '[]'::jsonb)
  )
  from public.barbershops b
  where lower(trim(b.slug)) = lower(trim(p_slug))
  limit 1;
$$;

create or replace function public.get_public_available_slots(
  p_slug text,
  p_service_id uuid,
  p_date date
)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  target_shop public.barbershops%rowtype;
  service_duration integer;
  weekday_key text;
  day_config jsonb;
  opens_at time;
  closes_at time;
  result jsonb;
begin
  if p_date < current_date or p_date > current_date + 60 then
    return '[]'::jsonb;
  end if;

  select * into target_shop
  from public.barbershops
  where lower(trim(slug)) = lower(trim(p_slug));

  if target_shop.id is null then
    return '[]'::jsonb;
  end if;

  select coalesce(duration_min, 40) into service_duration
  from public.catalog_items
  where id = p_service_id
    and barbershop_id = target_shop.id
    and type = 'servico'
    and active = true;

  if service_duration is null then
    return '[]'::jsonb;
  end if;

  weekday_key := (array['domingo','segunda','terca','quarta','quinta','sexta','sabado'])[extract(dow from p_date)::integer + 1];
  day_config := coalesce(
    target_shop.agenda_settings->'businessHours'->weekday_key,
    jsonb_build_object('closed', weekday_key = 'domingo', 'start', '09:00', 'end', '19:30')
  );

  if coalesce((day_config->>'closed')::boolean, false) then
    return '[]'::jsonb;
  end if;

  opens_at := coalesce((day_config->>'start')::time, '09:00'::time);
  closes_at := coalesce((day_config->>'end')::time, '19:30'::time);

  select coalesce(jsonb_agg(to_char(slot_value, 'HH24:MI') order by slot_value), '[]'::jsonb)
  into result
  from generate_series(
    p_date + opens_at,
    p_date + closes_at - make_interval(mins => service_duration),
    interval '30 minutes'
  ) slot_value
  where slot_value > now()
    and exists (
      select 1
      from public.employees e
      where e.barbershop_id = target_shop.id
        and e.active = true
        and (lower(e.role) = 'barber' or lower(e.role) like '%barbeiro%')
        and not exists (
          select 1
          from public.appointments a
          where a.employee_id = e.id
            and a.date = p_date
            and a.status <> 'cancelado'
            and a.start < (slot_value::time + make_interval(mins => service_duration))
            and (a.start + make_interval(mins => a.duration_min)) > slot_value::time
        )
    );

  return result;
end;
$$;

create or replace function public.create_public_appointment(
  p_slug text,
  p_service_id uuid,
  p_date date,
  p_start time,
  p_client_name text,
  p_phone text,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_shop public.barbershops%rowtype;
  target_service public.catalog_items%rowtype;
  target_employee public.employees%rowtype;
  target_client public.clients%rowtype;
  clean_name text := trim(p_client_name);
  clean_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  created_appointment uuid;
begin
  if char_length(clean_name) < 2 then
    raise exception 'Informe seu nome.';
  end if;
  if char_length(clean_phone) < 10 or char_length(clean_phone) > 13 then
    raise exception 'Informe um telefone válido com DDD.';
  end if;
  if p_date < current_date or p_date > current_date + 60 or (p_date + p_start) <= now() then
    raise exception 'Escolha uma data e um horário futuros.';
  end if;

  select * into target_shop
  from public.barbershops
  where lower(trim(slug)) = lower(trim(p_slug));
  if target_shop.id is null then
    raise exception 'Barbearia não encontrada.';
  end if;

  select * into target_service
  from public.catalog_items
  where id = p_service_id
    and barbershop_id = target_shop.id
    and type = 'servico'
    and active = true;
  if target_service.id is null then
    raise exception 'Serviço indisponível.';
  end if;

  perform pg_advisory_xact_lock(hashtext(target_shop.id::text || p_date::text || p_start::text));

  select e.* into target_employee
  from public.employees e
  where e.barbershop_id = target_shop.id
    and e.active = true
    and (lower(e.role) = 'barber' or lower(e.role) like '%barbeiro%')
    and not exists (
      select 1
      from public.appointments a
      where a.employee_id = e.id
        and a.date = p_date
        and a.status <> 'cancelado'
        and a.start < (p_start + make_interval(mins => coalesce(target_service.duration_min, 40)))
        and (a.start + make_interval(mins => a.duration_min)) > p_start
    )
  order by e.name
  limit 1;

  if target_employee.id is null then
    raise exception 'Este horário acabou de ficar indisponível. Escolha outro.';
  end if;

  select * into target_client
  from public.clients c
  where c.barbershop_id = target_shop.id
    and regexp_replace(coalesce(c.phone, ''), '\D', '', 'g') = clean_phone
  order by c.created_at
  limit 1;

  if target_client.id is null then
    insert into public.clients (barbershop_id, name, phone)
    values (target_shop.id, clean_name, clean_phone)
    returning * into target_client;
  else
    update public.clients
    set name = clean_name, phone = clean_phone
    where id = target_client.id
    returning * into target_client;
  end if;

  insert into public.appointments (
    barbershop_id, client_id, employee_id, service_id,
    client_name, employee_name, service_name,
    date, start, duration_min, status, price, notes
  ) values (
    target_shop.id, target_client.id, target_employee.id, target_service.id,
    clean_name, target_employee.name, target_service.name,
    p_date, p_start, coalesce(target_service.duration_min, 40), 'agendado',
    target_service.price, nullif(trim(coalesce(p_notes, '')), '')
  )
  returning id into created_appointment;

  return jsonb_build_object(
    'appointmentId', created_appointment,
    'barbershopName', target_shop.name,
    'serviceName', target_service.name,
    'date', p_date,
    'start', to_char(p_start, 'HH24:MI')
  );
end;
$$;

revoke all on function public.get_public_booking_page(text) from public;
revoke all on function public.get_public_available_slots(text, uuid, date) from public;
revoke all on function public.create_public_appointment(text, uuid, date, time, text, text, text) from public;

grant execute on function public.get_public_booking_page(text) to anon, authenticated;
grant execute on function public.get_public_available_slots(text, uuid, date) to anon, authenticated;
grant execute on function public.create_public_appointment(text, uuid, date, time, text, text, text) to anon, authenticated;
