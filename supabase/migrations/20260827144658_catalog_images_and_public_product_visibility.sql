alter table public.catalog_items
  add column if not exists image_url text;

do $$
begin
  update public.barbershops
  set public_booking_settings = jsonb_set(
    coalesce(public_booking_settings, '{}'::jsonb),
    '{showProducts}',
    'true'::jsonb,
    true
  )
  where not (coalesce(public_booking_settings, '{}'::jsonb) ? 'showProducts');
end $$;

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
      'color', coalesce(b.color, '#1E3A32'),
      'logoUrl', b.logo_url
    ),
    'services', coalesce((select jsonb_agg(jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'category', coalesce(c.category, ''),
      'price', c.price,
      'durationMin', coalesce(c.duration_min, 40),
      'imageUrl', c.image_url
    ) order by c.name) from public.catalog_items c where c.barbershop_id = b.id and c.type = 'servico' and c.active = true), '[]'::jsonb),
    'employees', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'name', e.name, 'avatarUrl', e.avatar_url) order by e.name) from public.employees e where e.barbershop_id = b.id and e.active = true and (lower(e.role) = 'barber' or lower(e.role) like '%barbeiro%')), '[]'::jsonb),
    'products', case when coalesce((b.public_booking_settings->>'showProducts')::boolean, true) then coalesce((select jsonb_agg(jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'category', coalesce(c.category, ''),
      'price', c.price,
      'stock', c.stock,
      'imageUrl', c.image_url
    ) order by c.name) from public.catalog_items c where c.barbershop_id = b.id and c.type = 'produto' and c.active = true and (c.stock is null or c.stock > 0) and c.id::text in (select jsonb_array_elements_text(coalesce(b.public_booking_settings->'productIds', '[]'::jsonb)))), '[]'::jsonb) else '[]'::jsonb end,
    'publicBooking', jsonb_build_object(
      'showProducts', coalesce((b.public_booking_settings->>'showProducts')::boolean, true),
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
