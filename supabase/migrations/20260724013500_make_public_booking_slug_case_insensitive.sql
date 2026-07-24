do $migration$
declare
  function_oid oid;
  original_definition text;
  updated_definition text;
begin
  foreach function_oid in array array[
    'public.get_public_booking_page(text)'::regprocedure::oid,
    'public.get_public_available_slots(text,uuid,date)'::regprocedure::oid,
    'public.create_public_appointment(text,uuid,date,time without time zone,text,text,text)'::regprocedure::oid
  ]
  loop
    original_definition := pg_get_functiondef(function_oid);
    updated_definition := replace(
      replace(
        original_definition,
        'where b.slug = lower(trim(p_slug))',
        'where lower(trim(b.slug)) = lower(trim(p_slug))'
      ),
      'where slug = lower(trim(p_slug))',
      'where lower(trim(slug)) = lower(trim(p_slug))'
    );

    if updated_definition = original_definition then
      raise exception 'Public booking function % does not contain the expected slug lookup.', function_oid::regprocedure;
    end if;

    execute updated_definition;
  end loop;
end
$migration$;
