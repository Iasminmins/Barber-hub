-- Central de mensagens da plataforma (admin → barbearias/responsáveis)
-- Provedores (WhatsApp, SMS, e-mail) ficam desacoplados; envios reais exigem configuração posterior.

create table if not exists public.platform_message_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  channel text not null check (channel in ('whatsapp', 'email', 'sms', 'in_app')),
  subject text,
  body text not null,
  variables text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_messages (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null,
  admin_email text not null,
  channel text not null check (channel in ('whatsapp', 'email', 'sms', 'in_app')),
  subject text,
  body text not null,
  status text not null default 'draft' check (status in (
    'draft', 'scheduled', 'queued', 'sent', 'delivered', 'read', 'replied', 'failed', 'cancelled'
  )),
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipient_count integer not null default 0,
  filter_snapshot jsonb not null default '{}',
  template_id uuid references public.platform_message_templates(id) on delete set null,
  estimated_cost numeric(12,2),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_message_recipients (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.platform_messages(id) on delete cascade,
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  recipient_name text,
  recipient_email text,
  recipient_phone text,
  personalized_body text not null,
  status text not null default 'pending' check (status in (
    'pending', 'queued', 'sent', 'delivered', 'read', 'replied', 'failed', 'cancelled'
  )),
  provider_ref text,
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_message_inbox (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid not null references public.barbershops(id) on delete cascade,
  channel text not null check (channel in ('whatsapp', 'email', 'sms', 'in_app')),
  direction text not null check (direction in ('inbound', 'outbound')),
  sender_name text,
  sender_email text,
  sender_phone text,
  subject text,
  body text not null,
  message_id uuid references public.platform_messages(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_messages_status on public.platform_messages(status);
create index if not exists idx_platform_messages_scheduled on public.platform_messages(scheduled_at) where status = 'scheduled';
create index if not exists idx_platform_message_recipients_message on public.platform_message_recipients(message_id);
create index if not exists idx_platform_message_recipients_shop on public.platform_message_recipients(barbershop_id);
create index if not exists idx_platform_message_inbox_unread on public.platform_message_inbox(barbershop_id) where read_at is null;

alter table public.platform_message_templates enable row level security;
alter table public.platform_messages enable row level security;
alter table public.platform_message_recipients enable row level security;
alter table public.platform_message_inbox enable row level security;

revoke all on public.platform_message_templates from anon, authenticated;
revoke all on public.platform_messages from anon, authenticated;
revoke all on public.platform_message_recipients from anon, authenticated;
revoke all on public.platform_message_inbox from anon, authenticated;

grant all on public.platform_message_templates to service_role;
grant all on public.platform_messages to service_role;
grant all on public.platform_message_recipients to service_role;
grant all on public.platform_message_inbox to service_role;

-- Modelos iniciais
insert into public.platform_message_templates (slug, name, channel, subject, body, variables) values
  ('boas-vindas', 'Boas-vindas', 'email', 'Bem-vindo ao Barber Hub, {{nome_barbearia}}!',
   'Olá, {{nome_responsavel}}!\n\nSua barbearia {{nome_barbearia}} foi cadastrada com sucesso no Barber Hub.\n\nPlano atual: {{plano}}\n\nEstamos à disposição para ajudar no que precisar.\n\nEquipe Barber Hub',
   array['nome_responsavel', 'nome_barbearia', 'plano']),
  ('teste-terminando', 'Teste gratuito terminando', 'whatsapp', null,
   'Olá, {{nome_responsavel}}! Seu teste gratuito do Barber Hub para {{nome_barbearia}} termina em {{dias_restantes}} dia(s) ({{data_vencimento}}).\n\nAssine agora e continue usando todos os recursos: {{link_pagamento}}',
   array['nome_responsavel', 'nome_barbearia', 'dias_restantes', 'data_vencimento', 'link_pagamento']),
  ('convite-assinatura', 'Convite para assinar', 'email', 'Continue com o Barber Hub — {{nome_barbearia}}',
   'Olá, {{nome_responsavel}}!\n\nNotamos que {{nome_barbearia}} ainda está em período de teste. Que tal assinar o plano {{plano}} e desbloquear todos os recursos?\n\n{{link_pagamento}}\n\nEquipe Barber Hub',
   array['nome_responsavel', 'nome_barbearia', 'plano', 'link_pagamento']),
  ('cobranca-proxima', 'Cobrança próxima do vencimento', 'email', 'Cobrança próxima — {{nome_barbearia}}',
   'Olá, {{nome_responsavel}}!\n\nSua assinatura do plano {{plano}} vence em {{data_vencimento}}.\n\nValor: conforme plano contratado.\n\n{{link_pagamento}}\n\nEquipe Barber Hub',
   array['nome_responsavel', 'nome_barbearia', 'plano', 'data_vencimento', 'link_pagamento']),
  ('pagamento-atrasado', 'Pagamento atrasado', 'whatsapp', null,
   'Olá, {{nome_responsavel}}! Identificamos pendência na assinatura de {{nome_barbearia}} (plano {{plano}}).\n\nRegularize em: {{link_pagamento}}\n\nEquipe Barber Hub',
   array['nome_responsavel', 'nome_barbearia', 'plano', 'link_pagamento']),
  ('pagamento-confirmado', 'Pagamento confirmado', 'email', 'Pagamento confirmado — {{nome_barbearia}}',
   'Olá, {{nome_responsavel}}!\n\nConfirmamos o recebimento do pagamento da assinatura {{plano}} de {{nome_barbearia}}.\n\nObrigado pela confiança!\n\nEquipe Barber Hub',
   array['nome_responsavel', 'nome_barbearia', 'plano']),
  ('cliente-inativo', 'Cliente inativo', 'email', 'Sentimos sua falta — {{nome_barbearia}}',
   'Olá, {{nome_responsavel}}!\n\nNotamos que {{nome_barbearia}} não acessa o Barber Hub há algum tempo.\n\nPodemos ajudar com algo? Responda este e-mail ou acesse sua conta.\n\nEquipe Barber Hub',
   array['nome_responsavel', 'nome_barbearia']),
  ('novidade-plataforma', 'Novidade na plataforma', 'in_app', 'Novidade no Barber Hub',
   'Olá, {{nome_responsavel}}! Temos novidades no Barber Hub para {{nome_barbearia}}. Acesse o painel para conferir.',
   array['nome_responsavel', 'nome_barbearia']),
  ('oferta-especial', 'Oferta ou condição especial', 'email', 'Condição especial para {{nome_barbearia}}',
   'Olá, {{nome_responsavel}}!\n\nPreparamos uma condição especial para {{nome_barbearia}} no plano {{plano}}.\n\nEntre em contato ou acesse: {{link_pagamento}}\n\nEquipe Barber Hub',
   array['nome_responsavel', 'nome_barbearia', 'plano', 'link_pagamento'])
on conflict (slug) do nothing;
