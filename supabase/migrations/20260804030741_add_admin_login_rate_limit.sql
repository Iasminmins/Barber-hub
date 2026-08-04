create table if not exists public.platform_login_rate_limits (
  rate_key text primary key check (rate_key ~ '^[a-f0-9]{64}$'),
  failure_count integer not null default 0 check (failure_count >= 0),
  window_started_at timestamptz not null default now(),
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.platform_login_rate_limits enable row level security;
revoke all on public.platform_login_rate_limits from public, anon, authenticated;

create index if not exists idx_platform_login_rate_limits_updated
  on public.platform_login_rate_limits(updated_at);

create or replace function public.apply_platform_login_rate_limit(
  p_rate_key text,
  p_action text,
  p_limit integer,
  p_window_seconds integer default 900
)
returns table (locked boolean, retry_after integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_row public.platform_login_rate_limits%rowtype;
  v_now timestamptz := clock_timestamp();
begin
  if p_rate_key !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid rate limit key';
  end if;
  if p_action not in ('check', 'failure', 'success') then
    raise exception 'invalid rate limit action';
  end if;
  if p_limit < 1 or p_limit > 1000 or p_window_seconds < 60 or p_window_seconds > 86400 then
    raise exception 'invalid rate limit configuration';
  end if;

  if p_action = 'success' then
    delete from public.platform_login_rate_limits where rate_key = p_rate_key;
    return query select false, 0;
    return;
  end if;

  if p_action = 'failure' then
    insert into public.platform_login_rate_limits (rate_key, failure_count, window_started_at, updated_at)
    values (p_rate_key, 0, v_now, v_now)
    on conflict (rate_key) do nothing;

    select * into current_row
    from public.platform_login_rate_limits
    where rate_key = p_rate_key
    for update;

    if current_row.window_started_at <= v_now - make_interval(secs => p_window_seconds) then
      current_row.failure_count := 0;
      current_row.window_started_at := v_now;
      current_row.blocked_until := null;
    end if;

    current_row.failure_count := current_row.failure_count + 1;
    if current_row.failure_count >= p_limit then
      current_row.blocked_until := greatest(
        coalesce(current_row.blocked_until, v_now),
        v_now + make_interval(secs => p_window_seconds)
      );
    end if;

    update public.platform_login_rate_limits
    set failure_count = current_row.failure_count,
        window_started_at = current_row.window_started_at,
        blocked_until = current_row.blocked_until,
        updated_at = v_now
    where rate_key = p_rate_key;
  else
    select * into current_row
    from public.platform_login_rate_limits
    where rate_key = p_rate_key;
  end if;

  -- Limpeza limitada e indexada; evita crescimento ilimitado sem gerar lock longo.
  delete from public.platform_login_rate_limits
  where rate_key in (
    select rate_key
    from public.platform_login_rate_limits
    where updated_at < v_now - interval '24 hours'
    order by updated_at
    limit 100
  );

  return query select
    coalesce(current_row.blocked_until > v_now, false),
    case
      when current_row.blocked_until > v_now
        then greatest(1, ceil(extract(epoch from (current_row.blocked_until - v_now)))::integer)
      else 0
    end;
end;
$$;

revoke all on function public.apply_platform_login_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.apply_platform_login_rate_limit(text, text, integer, integer)
  to service_role;

notify pgrst, 'reload schema';
