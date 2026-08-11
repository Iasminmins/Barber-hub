# Filtros de retorno e agendamentos do dashboard

## Objetivo

Dar ao dashboard uma visão acionável de clientes que não retornam há um período definido e evitar que agendamentos antigos não confirmados permaneçam na lista principal.

## Regras aprovadas

- O último atendimento válido será obtido a partir de pedidos pagos/concluídos, não de agendamentos cancelados ou faltas.
- O filtro de retorno terá as opções 30, 60, 90 dias e personalizado.
- O período de retorno será calculado em relação à data atual e exibirá clientes cujo último atendimento ocorreu há pelo menos o limite escolhido.
- Agendamentos com status `agendado` que estejam há mais de 2 dias sem confirmação serão ocultados da lista principal do dashboard.
- Esses agendamentos não serão apagados; a regra atua somente na visualização atual.

## Experiência

O card de clientes em risco/retorno terá um controle compacto de período e um link para a lista de clientes filtrada. O card de agendamentos exibirá apenas os próximos registros relevantes e incluirá uma indicação discreta quando houver itens expirados ocultos.

## Implementação

A lógica será isolada em funções puras no dashboard para permitir testes de datas e status. A UI usará os componentes de select existentes e manterá o layout atual responsivo.

## Verificação

Serão adicionados testes para: limiar de retorno, cliente sem histórico de atendimento, agendamento confirmado antigo e agendamento não confirmado expirado.
