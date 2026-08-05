# Integração entre Agenda, Comandas e Notificações

## Objetivo

Conectar o atendimento agendado à venda real sem alterar o fluxo de quem prefere usar Agenda e PDV separadamente. A criação da comanda a partir da Agenda será opcional. O pagamento de uma comanda vinculada concluirá o agendamento e atualizará os indicadores da Agenda.

## Escopo

- Vínculo explícito e único entre agendamento e comanda.
- Criação opcional de comanda pelo detalhe do agendamento.
- Sincronização da conclusão quando uma comanda vinculada for paga.
- Permanência visual dos agendamentos concluídos em verde.
- Filtro local para ocultar ou exibir concluídos.
- Indicadores da Agenda calculados pelo período e barbeiro selecionados.
- Notificações de agendamento, estoque e comanda com destino e ação claros.

Não serão removidos agendamentos concluídos, nem será criada uma comanda automaticamente quando o agendamento nascer.

## Modelo de dados

`orders` receberá `appointment_id uuid null`, referenciando `appointments(id)` com `on delete set null`. Um índice único parcial impedirá duas comandas vinculadas ao mesmo agendamento, preservando comandas avulsas com valor nulo.

O tipo `Order` e o carregamento central de dados passarão a expor `appointmentId`. A criação e a edição de comandas manterão esse vínculo.

## Fluxo Agenda → Comanda

1. O usuário abre um agendamento.
2. Se ele não possuir comanda vinculada e não estiver cancelado ou marcado como falta, o detalhe mostra `Criar comanda`.
3. O clique abre a tela de nova comanda com identificador do agendamento na URL.
4. A tela preenche cliente, responsável, serviço agendado, quantidade 1, preço do agendamento e data/hora.
5. O usuário pode incluir produtos ou serviços, aplicar desconto ou acréscimo e definir o pagamento.
6. Ao salvar, a comanda nasce `aberta`; o agendamento não é concluído.
7. Quando já existir vínculo, o detalhe mostra `Ver comanda #N` e abre a comanda correspondente.

Comandas criadas diretamente pelo PDV continuam funcionando sem agendamento.

## Pagamento e conclusão

Ao salvar uma comanda vinculada com status `paga`, o sistema atualizará o agendamento para `concluido`. Uma comanda aberta ou pendente não altera o status do agendamento.

O valor realizado será o total efetivamente pago na comanda, incluindo produtos, descontos e acréscimos. A implementação preservará a lógica financeira atual e evitará duplicação do lançamento ao editar novamente uma comanda já paga.

Se uma comanda paga for reaberta, cancelada ou excluída, o sistema não reabrirá silenciosamente o agendamento. A operação exibirá confirmação e manterá o histórico consistente; a reversão financeira e de estoque seguirá as regras já existentes da Comanda.

## Agenda e indicadores

Os agendamentos concluídos permanecerão na grade do dia com fundo/borda verdes, ícone de check e texto de status. `Ocultar concluídos` será um controle visual, ativado apenas quando o usuário escolher, e não alterará os dados.

Os indicadores obedecerão ao modo Dia/Semana/Mês e ao filtro de barbeiro:

- Agendamentos no período: todos, exceto cancelados quando indicado no texto auxiliar.
- Confirmados / na loja: status `confirmado` ou `chegou`.
- Concluídos: status `concluido`.
- Receita realizada: soma das comandas pagas vinculadas aos agendamentos filtrados.

Agendamentos concluídos sem comanda antiga continuarão contando como concluídos, mas não gerarão receita realizada presumida.

## Notificações

### Agendamentos

- Um novo agendamento fica não lido até ser aberto ou marcado como lido.
- Itens históricos com mais de 24 horas não inflam o contador de novidades.
- O clique abre a data e o agendamento correto.
- Agendamentos concluídos, cancelados ou marcados como falta deixam de ser pendência.

Nesta etapa, a leitura continuará no armazenamento local já existente, com expiração corrigida. Persistência por usuário no banco fica fora do escopo para evitar adicionar uma nova central de eventos sem necessidade imediata.

### Estoque

- O card inteiro abre o produto em Produtos & Serviços.
- A ação `Repor estoque` abre diretamente a edição do produto para registrar o novo saldo.
- O alerta permanece enquanto o saldo estiver no limite baixo, mas não é chamado de “novo”.

### Comandas

- O card abre a comanda correspondente.
- Somente abertas e pendentes aparecem como pendências.

O sino distinguirá `novas` de `pendências`: o badge principal contará somente agendamentos não lidos, enquanto as abas continuarão mostrando a quantidade de pendências operacionais.

## Estados de erro

- Se a comanda já tiver sido criada por outra sessão, a tentativa de duplicação será bloqueada pelo banco e a interface abrirá a comanda existente.
- Se o agendamento, serviço, cliente ou barbeiro não estiver mais disponível, a tela preservará os nomes históricos e pedirá apenas os campos realmente necessários para salvar.
- Se a comanda for paga, mas a atualização do agendamento falhar, a interface mostrará erro explícito e permitirá nova tentativa sem criar outro lançamento financeiro.

## Acessibilidade

- Ações de Agenda e Notificações serão botões ou links reais, com foco visível e nomes acessíveis.
- Cor não será o único indicador: agendamentos concluídos terão check e texto.
- `Ocultar concluídos` informará seu estado por texto e atributo acessível.
- Abas de notificação manterão rótulos compreensíveis em telas menores.

## Testes

- Migração: vínculo nulo permitido e unicidade de comanda por agendamento.
- Criação: formulário pré-preenchido e comanda salva como aberta.
- Duplicidade: segundo clique redireciona para a comanda existente.
- Pagamento: comanda paga conclui o agendamento vinculado.
- Agenda: concluído permanece verde e pode ser ocultado/exibido.
- Indicadores: respeitam período e barbeiro; receita usa total pago.
- Notificações: expiração de 24 horas, clique em agendamento, produto e comanda.
- Regressão: comanda avulsa continua funcionando sem `appointment_id`.

## Critérios de aceite

- Criar comanda pela Agenda é opcional e nunca acontece apenas ao criar o agendamento.
- A comanda criada pelo agendamento inicia aberta e editável.
- Pagar a comanda vinculada conclui o agendamento uma única vez.
- O agendamento concluído permanece verde na Agenda e pode ser ocultado sem exclusão.
- Receita da Agenda corresponde ao valor pago em comandas vinculadas.
- Alertas acionáveis levam ao registro correto.
- O contador do sino não chama todas as pendências permanentes de notificações novas.
