alter table public.assistant_usage
drop constraint if exists assistant_usage_period_check;

alter table public.assistant_usage
add constraint assistant_usage_period_check
check (period ~ '^[0-9]{4}-[0-9]{2}$');
