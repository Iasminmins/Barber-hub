# BarberHub

Sistema de gestão para barbearias construído com Next.js e Supabase.

## Preparação do ambiente

1. Crie um projeto no Supabase.
2. Execute, em ordem, todos os arquivos de `supabase/migrations` no SQL Editor.
3. Copie `.env.example` para `.env.local` e preencha a URL e a chave pública do projeto.
4. No Supabase Auth, configure a URL do site e adicione `/atualizar-senha` às URLs de redirecionamento permitidas.
5. Execute `pnpm install` e `pnpm check`.

## Variáveis obrigatórias

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Nunca coloque a chave `service_role` em uma variável `NEXT_PUBLIC_`.

## Antes da entrega

- Cadastre uma conta real e confirme o e-mail.
- Valide cliente, funcionário, catálogo, agenda, comanda, financeiro e assinatura.
- Confirme que usuários de outra barbearia não enxergam esses dados.
- Configure domínio, e-mails de autenticação, política de backup e monitoramento no Supabase.
- A cobrança dos planos é ativada comercialmente; não existe cobrança automática no código atual.
