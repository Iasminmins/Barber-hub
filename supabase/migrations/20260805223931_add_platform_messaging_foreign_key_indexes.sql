create index if not exists idx_platform_messages_template_id
  on public.platform_messages(template_id);

create index if not exists idx_platform_message_inbox_message_id
  on public.platform_message_inbox(message_id);
