# Configuração do Asaas

O BarberHub concede 30 dias grátis por barbearia. Ao cadastrar o pagamento, o sistema cria um cliente e uma assinatura mensal no Asaas com o primeiro vencimento no fim do teste.

## Variáveis no Vercel

- `SUPABASE_SERVICE_ROLE_KEY`: chave secreta do projeto Supabase, usada somente no servidor.
- `ASAAS_API_URL`: `https://api-sandbox.asaas.com/v3` nos testes e `https://api.asaas.com/v3` em produção.
- `ASAAS_API_KEY`: chave de API da conta Asaas.
- `ASAAS_WEBHOOK_TOKEN`: token forte criado por você para autenticar os webhooks.

Nunca prefixe essas variáveis com `NEXT_PUBLIC_`.

## Webhook no Asaas

Cadastre a URL:

`https://barber-hub-conect.vercel.app/api/webhooks/asaas`

Use no Asaas o mesmo token configurado em `ASAAS_WEBHOOK_TOKEN` e habilite os eventos:

- `PAYMENT_CONFIRMED`
- `PAYMENT_RECEIVED`
- `PAYMENT_OVERDUE`
- `PAYMENT_REFUNDED`
- `PAYMENT_DELETED`

Valide todo o fluxo no sandbox antes de trocar a URL da API para produção.
