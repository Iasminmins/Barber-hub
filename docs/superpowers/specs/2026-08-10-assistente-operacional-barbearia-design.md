# Assistente operacional da barbearia

## Objetivo

Adicionar um assistente de chat dentro da Barber Hub para responder perguntas operacionais da plataforma e consultas simples sobre dados da barbearia. O MVP deve ser barato, seguro e limitado ao contexto da Barber Hub.

## Escopo do MVP

O assistente responde perguntas sobre:

- faturamento de hoje;
- faturamento do mes atual;
- quantidade de comandas de hoje;
- formas de pagamento de hoje;
- agenda de hoje;
- agenda de amanha;
- clientes novos no mes;
- servico mais vendido no mes;
- funcionario que mais vendeu no mes;
- ajuda de uso da plataforma, como criar comanda, cadastrar cliente e gerar relatorio.

Perguntas fora desse escopo recebem uma resposta curta informando que o assistente so pode ajudar com a Barber Hub e os dados da barbearia.

## Regras de permissao

O assistente deve respeitar as permissoes atuais da plataforma.

- Dono/admin pode consultar dados gerais da barbearia, incluindo faturamento.
- Funcionario/barbeiro nao pode consultar faturamento geral.
- Funcionario/barbeiro pode receber ajuda de uso da plataforma.
- Funcionario/barbeiro so pode consultar dados proprios quando o dado existir de forma segura no backend, como agenda propria ou vendas proprias.

No MVP, qualquer intencao financeira geral deve ser bloqueada para perfis sem permissao administrativa.

## Limite de uso

Cada usuario autenticado tem limite mensal conforme o plano da barbearia:

- Starter: 20 perguntas por usuario/mes;
- Pro: 50 perguntas por usuario/mes;
- Premium: 150 perguntas por usuario/mes.

O contador deve:

- ser separado por usuario e mes;
- resetar logicamente a cada novo mes;
- consumir limite apenas quando a pergunta for processada pelo assistente;
- bloquear novas perguntas quando o limite mensal acabar;
- retornar a quantidade restante para a interface.

Perguntas claramente fora do escopo podem ser bloqueadas antes da chamada ao modelo para reduzir custo.

## Arquitetura

O chat tera tres camadas:

1. Interface de chat dentro do painel autenticado.
2. Rota server-side `/api/assistant/chat`.
3. Servicos internos para classificar a pergunta, validar permissao, buscar dados e gerar resposta.

A IA nao deve acessar o banco diretamente. O backend deve mapear a pergunta para uma intencao permitida e executar apenas consultas/funcoes internas conhecidas.

## Intencoes suportadas

As intencoes iniciais sao:

- `revenue_today`
- `revenue_month`
- `orders_today`
- `payment_methods_today`
- `appointments_today`
- `appointments_tomorrow`
- `new_clients_month`
- `top_service_month`
- `top_employee_month`
- `help_create_order`
- `help_create_client`
- `help_reports`
- `out_of_scope`

Cada intencao deve ter uma resposta segura quando nao houver dados, quando a permissao for insuficiente ou quando ocorrer erro.

## Fluxo da pergunta

1. Usuario abre o assistente no painel.
2. Usuario envia uma pergunta.
3. A rota valida sessao e identifica barbearia, usuario e papel.
4. A rota verifica limite mensal.
5. A pergunta e classificada em uma intencao permitida.
6. A rota aplica regras de permissao da intencao.
7. O backend busca os dados necessarios com consultas controladas.
8. O modelo gera uma resposta curta usando apenas os dados retornados.
9. A rota registra o uso mensal e devolve resposta, intencao e limite restante.

## Modelo e custo

Usar um modelo barato para o MVP, preferencialmente `gpt-5-nano`, com respostas curtas e contexto minimo. O prompt deve reforcar:

- responder apenas sobre Barber Hub e dados da barbearia;
- nao inventar dados;
- nao responder assuntos externos;
- pedir para o usuario abrir a tela correta quando a pergunta for de ajuda operacional;
- manter respostas curtas.

## Interface

A interface inicial sera um botao de assistente dentro do app autenticado, abrindo uma janela compacta de chat.

A janela deve mostrar:

- mensagens do usuario e do assistente;
- estado de carregamento;
- erros amigaveis;
- limite restante do mes;
- sugestoes rapidas de perguntas comuns.

O componente deve seguir o visual atual do painel e nao ocupar a tela principal.

## Persistencia

Adicionar tabela para uso mensal do assistente, com pelo menos:

- `id`;
- `barbershop_id`;
- `user_id`;
- `period`;
- `used_count`;
- timestamps.

O historico completo das conversas nao faz parte do MVP. A interface pode manter mensagens apenas no estado local da sessao atual.

## Tratamento de erros

Casos esperados:

- sem sessao: retornar erro de autenticacao;
- sem permissao: explicar que aquele tipo de dado esta disponivel apenas para dono/admin;
- limite atingido: informar que o limite renova no primeiro dia do proximo mes;
- pergunta fora do escopo: responder que o assistente so ajuda com Barber Hub;
- falha de modelo/API: responder que nao foi possivel consultar agora;
- dados vazios: explicar que nao encontrou registros no periodo.

## Testes

Cobrir:

- classificacao de perguntas comuns;
- bloqueio de perguntas fora do escopo;
- permissao financeira para admin;
- bloqueio financeiro para funcionario;
- consumo e bloqueio do limite mensal;
- respostas de dados vazios;
- rota autenticada e nao autenticada.

## Fora do escopo

O MVP nao deve:

- criar, editar ou excluir registros por chat;
- executar SQL gerado por IA;
- expor historico completo de conversas;
- responder perguntas gerais fora da plataforma;
- permitir anexos, audio ou imagem;
- substituir relatorios completos da plataforma.
