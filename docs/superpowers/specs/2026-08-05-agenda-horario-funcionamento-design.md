# Agenda conforme horário de funcionamento

## Objetivo

A visão diária da Agenda deve usar o horário configurado para o dia da semana selecionado, em vez da faixa fixa de 08:00 a 19:00.

## Comportamento

- A grade começa na hora cheia anterior ou igual à abertura configurada.
- A grade termina na hora cheia posterior ou igual ao fechamento configurado.
- Agendamentos e bloqueios fora dessa faixa ampliam a grade para continuarem visíveis.
- Dias marcados como fechados exibem um aviso claro, mas preservam agendamentos excepcionais existentes.
- As visões semanal e mensal não mudam.
- Cada hora continua ocupando 64 pixels, preservando durações e sobreposições atuais.

## Responsabilidades

- `lib/agenda-grid.ts` calcula início, fim, horas e posições verticais sem depender da interface.
- `app/(app)/agenda/agenda-client.tsx` consome esse cálculo e renderiza a grade ou o estado de dia fechado.
- `lib/agenda-grid.test.ts` protege abertura/fracionamento, fechamento, dia fechado e eventos excepcionais.

## Validação

Executar testes unitários, lint, verificação de tipos e build de produção.
