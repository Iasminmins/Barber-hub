# Relatorio PDF do dashboard

## Objetivo

Substituir os botoes inativos de exportacao do dashboard por uma unica acao funcional de PDF. O arquivo deve representar exatamente o periodo ativo no dashboard, incluindo os periodos Hoje, Semana, Mes, Ano e Personalizado.

## Experiencia do usuario

- Remover o botao Excel.
- Manter um unico botao `PDF` ao lado do seletor de datas.
- Ao clicar, gerar e baixar o relatorio no navegador, sem navegar para outra tela.
- Enquanto o arquivo estiver sendo preparado, desabilitar o botao e exibir `Gerando...`.
- Se a geracao falhar, restaurar o botao e mostrar uma mensagem clara sem interromper o uso do dashboard.
- Nomear o arquivo com a barbearia e o intervalo, no formato `relatorio-<barbearia>-AAAA-MM-DD-a-AAAA-MM-DD.pdf`.

## Conteudo do relatorio

O PDF sera multipagina e tera identidade visual coerente com o BarberHub.

1. Cabecalho com nome da barbearia, periodo exato e data/hora de geracao.
2. Resumo financeiro com receita total, receita do PDV, receita de assinaturas, outras receitas e ticket medio.
3. Resumo operacional com comandas pagas, abertas e pendentes, clientes novos, assinaturas ativas, clientes em risco e itens com estoque baixo.
4. Comissoes pendentes no periodo.
5. Receita agrupada por forma de pagamento.
6. Ranking dos profissionais no periodo.
7. Tabela de comandas pagas, com data, identificacao, cliente, profissional, forma de pagamento e valor, quando houver dados.
8. Rodape com numeracao de pagina e identificacao do BarberHub.

Secoes sem registros exibirao um estado vazio legivel em vez de tabelas quebradas. Valores monetarios e datas usarao o padrao brasileiro.

## Arquitetura e fluxo de dados

- O dashboard continuara sendo a fonte unica do periodo e dos dados ja filtrados.
- Um modulo dedicado recebera um objeto simples com barbearia, intervalo, indicadores, agrupamentos e linhas detalhadas.
- Esse modulo sera responsavel somente por montar e baixar o PDF, mantendo a tela desacoplada da formatacao do documento.
- A implementacao seguira o padrao de PDF ja existente no projeto, com `jsPDF` e `jspdf-autotable`, carregados apenas quando o usuario clicar para evitar aumentar desnecessariamente o carregamento inicial do dashboard.
- O controle de periodo recebera uma funcao de exportacao e o estado de geracao; nao conhecera os detalhes internos do PDF.

## Tratamento de limites

- Intervalo sempre inclui integralmente as datas inicial e final selecionadas.
- Textos longos serao truncados ou quebrados dentro das celulas sem sobreposicao.
- Tabelas continuarao automaticamente em novas paginas, repetindo o cabecalho.
- Ausencia de logotipo ou dados opcionais nao impedira o download.
- O relatorio refletira os dados carregados no momento do clique.

## Testes e verificacao

- Testes unitarios validarao o modelo do relatorio, o intervalo, totais, estados vazios e o nome seguro do arquivo.
- Um teste de integracao do componente confirmara que Excel foi removido e que PDF chama a exportacao para o periodo atual.
- A verificacao executara testes, typecheck e lint relacionados.
- Um PDF de amostra sera gerado, renderizado em imagens e inspecionado para detectar cortes, sobreposicoes, paginas vazias e problemas de legibilidade.

## Fora do escopo

- Exportacao para Excel ou CSV.
- Envio do PDF por e-mail ou WhatsApp.
- Armazenamento permanente do relatorio no Supabase.
- Alteracao das regras de calculo dos indicadores do dashboard.
