# Rate limiting persistente do painel administrativo

## Objetivo

Proteger `POST /api/admin/login` contra tentativas automatizadas de senha em todas as instancias da Vercel. O bloqueio deve sobreviver a reinicios e escalonamento serverless, sem armazenar IP ou e-mail em texto legivel.

## Arquitetura

O Supabase sera a fonte compartilhada do estado de rate limiting. Uma tabela com RLS armazenara chaves derivadas por HMAC no servidor, contadores, inicio da janela e instante de bloqueio. `anon` e `authenticated` nao terao privilegios na tabela.

Uma funcao SQL atomica, exposta apenas ao `service_role`, executara tres operacoes:

- `check`: informa se a chave esta bloqueada e por quantos segundos;
- `failure`: incrementa o contador e cria o bloqueio quando o limite for atingido;
- `success`: remove o estado da chave depois de uma autenticacao valida.

A funcao tera `SECURITY DEFINER`, `search_path` fixo e `EXECUTE` revogado de `PUBLIC`, `anon` e `authenticated`. Somente `service_role` recebera execucao.

## Politica de bloqueio

Cada tentativa produz duas chaves independentes:

1. IP + e-mail: limite de 5 falhas em 15 minutos.
2. IP global: limite de 20 falhas em 15 minutos, mesmo alternando e-mails.

As chaves serao HMAC-SHA256 usando `PLATFORM_ADMIN_SECRET` (ou o segredo servidor ja usado como fallback). Nenhum IP ou e-mail sera persistido diretamente.

Antes de validar a senha, a API consulta as duas chaves. Se qualquer uma estiver bloqueada, responde `429` com `Retry-After`. Em falha de senha ou conta nao autorizada, incrementa ambas. Em sucesso, limpa ambas e cria a sessao administrativa normalmente.

## Concorrencia e expiracao

A atualizacao dos contadores sera atomica no PostgreSQL para impedir que requisicoes simultaneas ultrapassem o limite. Janelas vencidas reiniciam o contador. Registros inativos por mais de 24 horas poderao ser removidos durante as chamadas, sem cron adicional.

## Tratamento de falhas

Se o mecanismo persistente estiver indisponivel, o login retornara `503` em vez de ignorar a protecao. Erros internos nao revelarao se o e-mail existe, se a senha esta correta ou se a conta pertence a um administrador.

## Testes e verificacao

- Testes unitarios para derivacao das duas chaves e escolha do maior `Retry-After`.
- Teste do fluxo: liberado antes do limite, bloqueado na quinta falha por IP+e-mail e na vigesima falha por IP.
- Verificacao SQL de privilegios para garantir que apenas `service_role` executa a funcao e acessa a tabela.
- Typecheck, testes existentes e build de producao.
- Teste real no deploy: login valido continua retornando `200`; tentativas controladas em uma chave de teste retornam `429` sem bloquear a conta administrativa real.

## Protecao de senhas vazadas

O Supabase Security Advisor atualmente informa que a protecao contra senhas vazadas esta desativada. Sera ativada pela configuracao oficial de Auth se o conector disponibilizar essa mutacao. Caso a API conectada nao exponha essa opcao, a ativacao manual no Dashboard sera o unico passo externo restante e sera indicada com o caminho exato.
