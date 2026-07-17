create or replace function public.create_barbershop_for_current_user(
  barbershop_name text,
  barbershop_city text default null,
  owner_name text default null
)
returns table (
  barbershop_id uuid,
  member_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  current_user_email text;
  created_barbershop_id uuid;
  created_member_id uuid;
  base_slug text;
  final_slug text;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'User must be authenticated to create a barbershop';
  end if;

  select email
    into current_user_email
  from auth.users
  where id = current_user_id;

  if nullif(trim(barbershop_name), '') is null then
    raise exception 'Barbershop name is required';
  end if;

  if exists (
    select 1
    from public.members
    where user_id = current_user_id
      and active = true
  ) then
    raise exception 'User already belongs to a barbershop';
  end if;

  base_slug := lower(trim(barbershop_name));
  base_slug := translate(base_slug, 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN');
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  final_slug := coalesce(nullif(base_slug, ''), 'barbearia') || '-' || substr(replace(current_user_id::text, '-', ''), 1, 8);

  insert into public.barbershops (name, slug, city, plan)
  values (trim(barbershop_name), final_slug, nullif(trim(barbershop_city), ''), 'starter')
  returning id into created_barbershop_id;

  insert into public.members (barbershop_id, user_id, name, email, role, active)
  values (
    created_barbershop_id,
    current_user_id,
    coalesce(nullif(trim(owner_name), ''), split_part(coalesce(current_user_email, ''), '@', 1), 'Proprietário'),
    coalesce(current_user_email, ''),
    'owner',
    true
  )
  returning id into created_member_id;

  return query select created_barbershop_id, created_member_id;
end;
$$;

revoke all on function public.create_barbershop_for_current_user(text, text, text) from public;
grant execute on function public.create_barbershop_for_current_user(text, text, text) to authenticated;
