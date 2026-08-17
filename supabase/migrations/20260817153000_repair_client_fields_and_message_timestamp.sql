-- Keep production schemas compatible with the client form and persist WhatsApp contact time.
alter table public.clients
  add column if not exists postal_code text,
  add column if not exists address_number text,
  add column if not exists address_complement text,
  add column if not exists neighborhood text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists last_message_sent_at timestamptz;

