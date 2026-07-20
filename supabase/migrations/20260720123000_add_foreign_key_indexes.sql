create index if not exists idx_appointments_client_id on public.appointments(client_id);
create index if not exists idx_appointments_service_id on public.appointments(service_id);
create index if not exists idx_commissions_employee_id on public.commissions(employee_id);
create index if not exists idx_orders_client_id on public.orders(client_id);
create index if not exists idx_orders_employee_id on public.orders(employee_id);
create index if not exists idx_subscriptions_client_id on public.subscriptions(client_id);
create index if not exists idx_subscriptions_plan_id on public.subscriptions(plan_id);
