create table if not exists public.customer_reviews (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  client_name text not null,
  employee_name text not null,
  service_name text not null,
  rating smallint not null check (rating between 1 and 5),
  service_rating smallint not null check (service_rating between 1 and 5),
  environment_rating smallint not null check (environment_rating between 1 and 5),
  would_recommend boolean not null,
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_customer_reviews_barbershop_created
  on public.customer_reviews(barbershop_id, created_at desc);

alter table public.customer_reviews enable row level security;

drop policy if exists "customer_reviews_select_own_barbershop" on public.customer_reviews;
create policy "customer_reviews_select_own_barbershop"
on public.customer_reviews for select
to authenticated
using (private.user_has_barbershop_access(barbershop_id));

revoke all on public.customer_reviews from anon, authenticated;
grant select on public.customer_reviews to authenticated;

create or replace function public.submit_public_review(
  p_appointment_id uuid,
  p_phone text,
  p_rating smallint,
  p_service_rating smallint,
  p_environment_rating smallint,
  p_would_recommend boolean,
  p_comment text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  target public.appointments%rowtype;
  stored_id uuid;
  normalized_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
begin
  if p_rating not between 1 and 5 or p_service_rating not between 1 and 5 or p_environment_rating not between 1 and 5 then
    raise exception 'As notas devem estar entre 1 e 5.';
  end if;

  select a.* into target
  from public.appointments a
  left join public.clients c on c.id = a.client_id
  where a.id = p_appointment_id
    and regexp_replace(coalesce(c.phone, ''), '[^0-9]', '', 'g') = normalized_phone;

  if target.id is null then
    raise exception 'Não foi possível validar este agendamento.';
  end if;

  insert into public.customer_reviews (
    barbershop_id, appointment_id, client_name, employee_name, service_name,
    rating, service_rating, environment_rating, would_recommend, comment
  ) values (
    target.barbershop_id, target.id, target.client_name, target.employee_name, target.service_name,
    p_rating, p_service_rating, p_environment_rating, p_would_recommend, nullif(trim(p_comment), '')
  ) returning id into stored_id;

  return jsonb_build_object('id', stored_id, 'submitted', true);
exception
  when unique_violation then
    raise exception 'Este agendamento já recebeu uma avaliação.';
end;
$$;

revoke all on function public.submit_public_review(uuid, text, smallint, smallint, smallint, boolean, text) from public;
grant execute on function public.submit_public_review(uuid, text, smallint, smallint, smallint, boolean, text) to anon, authenticated;
