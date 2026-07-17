grant usage on schema private to authenticated;
grant execute on function private.user_has_barbershop_access(uuid) to authenticated;
grant execute on function private.user_is_barbershop_owner(uuid) to authenticated;

grant select, update on table public.barbershops to authenticated;
grant select, insert, update, delete on table public.members to authenticated;
grant select, insert, update, delete on table public.clients to authenticated;
grant select, insert, update, delete on table public.employees to authenticated;
grant select, insert, update, delete on table public.catalog_items to authenticated;
grant select, insert, update, delete on table public.appointments to authenticated;
grant select, insert, update, delete on table public.orders to authenticated;
grant select, insert, update, delete on table public.order_items to authenticated;
grant select, insert, update, delete on table public.plans to authenticated;
grant select, insert, update, delete on table public.subscriptions to authenticated;
grant select, insert, update, delete on table public.financial_entries to authenticated;
grant select, insert, update, delete on table public.commissions to authenticated;
grant select, insert, update, delete on table public.import_records to authenticated;
