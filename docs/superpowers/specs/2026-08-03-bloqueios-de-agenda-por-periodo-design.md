# Bloqueios de agenda por período

## Objetivo

Permitir que a barbearia indisponibilize a agenda de um profissional durante um período específico de um dia, sem perder a opção de bloquear o dia inteiro. Um bloqueio impede somente novos agendamentos; agendamentos já existentes são preservados.

## Experiência do usuário

Ao abrir o modal de bloqueio de um profissional, o usuário escolhe entre:

- **Dia inteiro:** bloqueia todos os novos horários daquele profissional na data selecionada.
- **Período:** exibe os campos `Das` e `Até`, com opções em intervalos de 30 minutos.

O horário final é exclusivo. Portanto, um bloqueio das 08:00 às 14:00 impede serviços que coincidam total ou parcialmente com esse intervalo e volta a permitir agendamentos a partir das 14:00.

O modal informa que agendamentos existentes dentro do período serão mantidos. O sistema valida que o início seja anterior ao fim. Após salvar, cada bloqueio aparece destacado sobre a coluna horária do profissional e pode ser removido individualmente. Um bloqueio de dia inteiro ocupa toda a coluna.

## Modelo de dados

A tabela `schedule_blocks` passa a armazenar `start_time` e `end_time`. Ambos são nulos para dia inteiro e ambos são preenchidos para um período. Uma restrição garante esses dois formatos válidos e outra garante `start_time < end_time`.

A unicidade atual por profissional e data será removida, permitindo vários períodos no mesmo dia. Uma nova restrição de exclusão impedirá períodos sobrepostos para o mesmo profissional e data, considerando dia inteiro como conflito com qualquer outro bloqueio. A interface também exibirá uma mensagem amigável se o banco rejeitar uma sobreposição.

## Regras de disponibilidade

Um novo agendamento conflita com um bloqueio quando os intervalos se sobrepõem:

`início do agendamento < fim do bloqueio` e `fim do agendamento > início do bloqueio`.

Para dia inteiro, qualquer novo agendamento daquele profissional e data conflita. A regra será aplicada em três camadas:

1. validação imediata no formulário interno;
2. cálculo de horários disponíveis no agendamento público;
3. trigger no banco para proteger inserções e alterações feitas por qualquer caminho.

As funções públicas de consulta e criação serão atualizadas para considerar também a duração do serviço, impedindo que um serviço iniciado antes do bloqueio avance para dentro dele.

## Componentes e fluxo

- `ScheduleBlock` ganha horários opcionais de início e fim.
- O carregamento de dados converte as novas colunas do Supabase.
- O modal da agenda cria um bloqueio de dia inteiro ou por período e lista os bloqueios existentes para remoção individual.
- A grade diária calcula a posição e altura de cada período e renderiza uma faixa visual não interativa.
- O formulário de novo agendamento reutiliza uma função pura de detecção de conflito.
- A migração altera a tabela, as restrições, o trigger e as funções RPC públicas.

## Erros e casos-limite

- Início igual ou posterior ao fim: não salvar e explicar o ajuste necessário.
- Períodos sobrepostos: não salvar e informar que já existe um bloqueio nesse horário.
- Agendamento que começa antes e termina dentro do bloqueio: impedir.
- Agendamento que começa exatamente no fim do bloqueio: permitir.
- Agendamentos existentes: manter sem alteração ou cancelamento automático.
- Exclusão: remover somente o bloqueio selecionado.

## Testes e verificação

Os testes unitários cobrirão a detecção de sobreposição, limites exatos, dia inteiro e múltiplos períodos. A implementação seguirá teste primeiro. Também serão executados lint, verificação de tipos, testes automatizados e build. A migração será revisada para manter as permissões e políticas existentes.
