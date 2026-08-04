# Período de tolerância da cobrança

## Objetivo

Impedir bloqueios causados por estados contraditórios do Asaas e permitir o uso da plataforma durante os primeiros sete dias de atraso.

## Regra

- Uma cobrança com vencimento futuro nunca gera aviso de atraso nem bloqueio, ainda que o status armazenado seja `past_due`.
- Do 1º ao 7º dia após o vencimento, a plataforma permanece liberada e exibe um aviso persistente no topo.
- O aviso informa há quantos dias o pagamento está pendente e que o bloqueio ocorrerá após o 7º dia.
- A partir do 8º dia de atraso, as operações ficam bloqueadas até a regularização.
- Durante o teste gratuito, continuam valendo a data final do teste e os avisos atuais.
- A mensagem sobre 30 dias grátis aparece somente enquanto o status for `trialing`.

## Confirmação do pagamento

Os eventos `PAYMENT_CONFIRMED` e `PAYMENT_RECEIVED` do webhook do Asaas continuam definindo a assinatura como `active`, registrando `last_payment_at` e avançando `next_billing_date`. Depois dessa atualização, o aviso e o bloqueio desaparecem.

## Testes

Testes unitários cobrirão cobrança futura com `past_due`, dias 1 e 7 de atraso, dia 8 de atraso e assinatura ativa após pagamento.
