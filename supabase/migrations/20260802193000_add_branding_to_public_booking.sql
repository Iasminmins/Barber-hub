create or replace function public.get_public_booking_page(p_slug text)
returns jsonb
language sql
security definer
set search_path = ''
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
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'category', coalesce(c.category, ''),
          'price', c.price,
          'durationMin', coalesce(c.duration_min, 40)
        ) order by c.name
      )
      from public.catalog_items c
      where c.barbershop_id = b.id
        and c.type = 'servico'
        and c.active = true
    ), '[]'::jsonb),
    'employees', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'name', e.name,
          'avatarUrl', coalesce(e.avatar_url, '')
        ) order by e.name
      )
      from public.employees e
      where e.barbershop_id = b.id
        and e.active = true
        and (lower(e.role) = 'barber' or lower(e.role) like '%barbeiro%')
    ), '[]'::jsonb)
  )
  from public.barbershops b
  where lower(trim(b.slug)) = lower(trim(p_slug))
  limit 1;
$$;

revoke all on function public.get_public_booking_page(text) from public;
grant execute on function public.get_public_booking_page(text) to anon, authenticated;
