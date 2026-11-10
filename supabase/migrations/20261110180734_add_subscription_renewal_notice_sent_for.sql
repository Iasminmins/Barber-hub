alter table public.subscriptions
  add column if not exists renewal_notice_sent_for date;
