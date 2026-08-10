alter table public.assistant_usage
  add column if not exists ai_calls integer not null default 0 check (ai_calls >= 0),
  add column if not exists input_tokens integer not null default 0 check (input_tokens >= 0),
  add column if not exists output_tokens integer not null default 0 check (output_tokens >= 0),
  add column if not exists estimated_cost_usd numeric(12,6) not null default 0 check (estimated_cost_usd >= 0);
