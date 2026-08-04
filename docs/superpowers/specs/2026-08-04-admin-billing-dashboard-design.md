# Painel administrativo de cobrança e receita

## Objetivo

Transformar `/plataforma` em uma central profissional para administrar planos, cobranças, cortesias e acessos das empresas, com indicadores executivos claros e operações sincronizadas com o Asaas.

## Escopo

O administrador controla somente:

- planos e assinaturas do BarberHub;
- datas de teste, vencimento e cortesias;
- status de cobrança e acesso operacional;
- usuários vinculados às empresas;
- histórico de pagamentos e alterações administrativas.

Dados operacionais das barbearias, como clientes, agenda, comandas e financeiro interno, permanecem fora do painel administrativo.

## Dashboard executivo

O topo do painel exibirá:

- MRR contratado: soma do preço mensal dos planos de empresas pagantes ou em cortesia ativa;
- receita prevista nos próximos 30 dias: soma das cobranças previstas no período, excluindo testes, cortesias, canceladas e cobranças sem vencimento no intervalo;
- empresas totais e empresas ativas;
- empresas em teste, em cortesia, inadimplentes e canceladas;
- ticket médio contratado;
- novos cadastros no mês;
- conversão de teste para assinatura, quando houver dados suficientes;
- pagamentos recebidos no mês, quando o Asaas estiver disponível;
- valor e quantidade de cortesias concedidas.

MRR contratado e receita prevista serão sempre apresentados separadamente para não confundir tamanho da carteira com entrada de caixa.

## Gestão da empresa

A página detalhada da empresa terá uma área de gestão de assinatura com:

- plano atual e alteração entre Starter, Pro e Premium;
- situação real da assinatura, derivada do status e da data de vencimento;
- próxima cobrança, último pagamento, fim do teste e identificação no Asaas;
- alteração da próxima data de cobrança;
- concessão rápida de 7, 15 ou 30 dias grátis;
- concessão de 1, 2 ou 3 meses grátis;
- quantidade personalizada de meses ou uma data final personalizada;
- ativação, suspensão, cancelamento e reativação;
- sincronização manual com o Asaas;
- motivo obrigatório para cortesias e alterações sensíveis.

## Regra de cortesia

Para uma assinatura existente, a cortesia avança a próxima cobrança a partir da data de vencimento atual quando ela estiver no futuro, ou a partir do dia atual quando estiver vencida. A nova data será salva no BarberHub e enviada ao Asaas. A empresa permanece ativa durante a cortesia.

Para uma empresa ainda em teste e sem assinatura no Asaas, a cortesia avança `trial_ends_at`. Quando a assinatura for criada, a primeira cobrança respeitará essa data.

Cada concessão registra empresa, administrador, duração, data anterior, nova data, valor estimado da cortesia, motivo e horário.

## Consistência e segurança

- Uma data futura nunca será exibida como atraso.
- O bloqueio operacional continuará começando somente no 8º dia de atraso.
- Alterações de plano, status, datas e cortesias passarão por validação no servidor.
- A atualização local só será confirmada depois da atualização necessária no Asaas; falhas externas retornam mensagem clara sem apresentar sucesso falso.
- Ações destrutivas ou que suspendem acesso exigirão confirmação.
- Toda mutação será registrada pelo mecanismo de auditoria administrativa já existente.

## Experiência de uso

O painel principal manterá busca e filtros, acrescentando filtros para cortesia e vencimento. As ações rápidas atuais serão substituídas por um botão “Gerenciar”, abrindo a página detalhada para evitar mudanças acidentais em uma tabela compacta.

Os indicadores usarão rótulos em português, valores monetários formatados e explicações curtas sobre o cálculo. Estados de carregamento, ausência de dados, indisponibilidade do Asaas e erros serão mostrados sem ocultar os demais dados locais.

## Testes e aceitação

- cálculo de MRR e ticket médio por plano e status;
- receita prevista excluindo teste, cortesia e cancelamento;
- avanço de dias e meses sem perder o dia correto do vencimento;
- cortesia em assinatura ativa, vencida e ainda em teste;
- validação de motivo, datas e limites;
- sincronização com o Asaas e comportamento quando o serviço falhar;
- registro de auditoria;
- situação visual coerente para vencimento futuro, tolerância e bloqueio;
- permissões administrativas preservadas em todas as rotas.
