# Atualização administrativa de assinatura no Asaas

## Objetivo

Permitir que o administrador altere plano, status e próxima cobrança sem reenviar campos inalterados nem tentar usar `nextDueDate` para modificar uma cobrança que o Asaas já gerou.

## Comportamento

- O backend compara plano, status e data recebidos com os valores atuais da barbearia.
- Alterações de plano atualizam a assinatura no Asaas com valor, ciclo, descrição e `updatePendingPayments: true` somente quando o plano realmente mudar.
- Alterações de data consultam `/subscriptions/{id}/payments`.
- Se existir uma cobrança pendente ou vencida com a data atualmente registrada, o backend atualiza seu `dueDate` em `/payments/{id}`.
- Se não existir cobrança já gerada para a data atual, o backend altera `nextDueDate` na assinatura.
- Status administrativo continua sendo local, pois os estados do BarberHub não possuem correspondência segura e completa com os estados `ACTIVE` e `INACTIVE` do Asaas.
- O Asaas é atualizado antes do Supabase. Se qualquer chamada externa falhar, nenhuma mudança local é persistida.

## Limites

- Cobranças recebidas, confirmadas, canceladas ou reembolsadas não serão alteradas.
- A busca usa todas as cobranças retornadas pela assinatura e escolhe a cobrança alterável cuja data coincide com a data local atual; caso não exista coincidência, usa a cobrança alterável mais próxima no futuro.
- A correção não cria, remove nem reativa assinaturas.

## Estrutura

A decisão sobre quais operações executar ficará em um módulo puro e testável de cobrança administrativa. A rota continuará responsável por autenticação, chamadas ao Asaas, persistência e auditoria.

## Testes

Testes unitários cobrirão: plano inalterado não gerar atualização; cobrança já gerada receber alteração em `/payments`; recorrência sem cobrança gerada receber `nextDueDate`; e cobranças liquidadas não serem escolhidas.
