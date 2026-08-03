# Ação inferior para salvar configurações

## Objetivo

Evitar que alterações feitas longe do topo da página passem despercebidas, oferecendo uma segunda ação de salvamento ao final do conteúdo editável.

## Escopo visual

- Adicionar uma barra de ação após o conteúdo da aba ativa.
- Usar um cartão/faixa clara, com borda, cantos arredondados e espaçamento consistente com os cartões existentes.
- Exibir o texto `Revise as informações antes de sair` e uma indicação curta de que a ação salva as configurações da unidade.
- Exibir à direita um botão dourado `Salvar alterações`, com o mesmo ícone e padrão visual do botão superior.
- Em telas pequenas, empilhar texto e botão; o botão deve ocupar toda a largura.

## Regras de exibição

A barra aparece somente nas abas com configurações editáveis pelo salvamento geral:

- Aparência
- Tela inicial
- Cores dos funcionários
- Agenda
- Pagamentos da barbearia

A barra não aparece em:

- Assinatura BarberHub, que possui o fluxo próprio de alteração de plano.
- Módulos, que é uma área informativa e contém a ação separada de encerrar sessão.

## Comportamento

- O botão inferior chama a mesma função `saveSettings` usada pelo botão superior.
- Durante o salvamento, ambos os botões ficam desabilitados e mostram `Salvando...`.
- Após sucesso, a indicação existente `Alterações salvas` continua sendo a confirmação principal.
- Nenhuma nova consulta, tabela, migration ou policy do Supabase será criada.

## Validação

- Testar que a barra aparece nas cinco abas editáveis.
- Testar que não aparece nas abas `assinatura` e `modulos`.
- Confirmar que o botão inferior usa o mesmo manipulador e estado de carregamento do botão superior.
- Executar lint do arquivo, TypeScript, testes e build de produção.
