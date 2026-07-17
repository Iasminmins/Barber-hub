# Supabase Setup

Este diretório guarda as migrations do banco do BarberHub.

## Primeiro passo em produção

1. Abra o projeto no Supabase.
2. Vá em `SQL Editor`.
3. Abra o arquivo `supabase/migrations/20260717085400_initial_barberhub_schema.sql`.
4. Copie todo o conteúdo.
5. Cole no SQL Editor.
6. Clique em `Run`.

## O que esta migration cria

- Tabelas principais: barbearias, membros, clientes, funcionários, catálogo, agenda, comandas, itens da comanda, planos, assinaturas, financeiro, comissões e importações.
- Índices para consultas do dashboard, agenda, comandas e financeiro.
- `updated_at` automático nas tabelas editáveis.
- RLS habilitado.
- Políticas por `barbershop_id`, usando a tabela `members`.
- Nenhuma barbearia fixa: a unidade deve ser criada pelo fluxo de cadastro do cliente.

## Próximo passo obrigatório

Depois de rodar a migration, o cadastro do app deve criar:

1. o usuário em `auth.users`;
2. a barbearia em `barbershops`, usando o nome informado pelo cliente;
3. o vínculo do dono em `members`, com `role = 'owner'`.

Use a função RPC `create_barbershop_for_current_user` depois que o usuário estiver autenticado. Ela cria a barbearia e o vínculo do dono no mesmo fluxo, sem expor chave `service_role` no frontend.
