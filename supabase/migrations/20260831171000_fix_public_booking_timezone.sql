-- Public booking dates and times are entered in the shop's Brazil timezone.
-- Keep the database globally in UTC, but make these comparisons local to the
-- booking functions so availability and confirmation use the same clock.
alter function public.get_public_available_slots(text, uuid, date, uuid)
  set timezone = 'America/Sao_Paulo';

alter function public.create_public_appointment(text, uuid, date, time, text, text, text, uuid, uuid[], jsonb, text, text)
  set timezone = 'America/Sao_Paulo';
