-- Telefone/WhatsApp do responsável, usado para envio manual pela Central de Mensagens da plataforma.

alter table public.members add column if not exists phone text;
