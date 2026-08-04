# PDF mensal por funcionário e login unificado da plataforma

**Data:** 2026-08-04  
**Status:** aprovado para planejamento

## Objetivo

Entregar duas melhorias independentes na área administrativa do MeuBarberHub:

1. permitir o fechamento mensal individual de cada funcionário por meio de um PDF detalhado;
2. usar `/login` como única entrada, reconhecer administradores da plataforma automaticamente e direcioná-los para `/plataforma`.

## 1. PDF mensal individual

### Experiência

Na aba **Equipe**, dentro de cada card do **Ranking do mês**, haverá uma ação secundária chamada **Gerar PDF**. O botão gera e baixa apenas o demonstrativo do funcionário daquele card, considerando o mês exibido no ranking.

O nome do arquivo seguirá o padrão:

`fechamento-<funcionario>-<AAAA-MM>.pdf`

### Conteúdo

O documento terá:

- identificação da barbearia;
- nome do funcionário;
- competência mensal;
- data e hora de emissão;
- quantidade de serviços vendidos;
- faturamento atribuído;
- faturamento de assinaturas;
- comissão de comandas;
- comissão de assinaturas;
- comissão total;
- memória de cálculo por comanda, com itens, base, percentual e comissão;
- observação explícita quando uma comanda de valor final zero não gerar comissão;
- total consolidado no encerramento.

Valores zerados serão mantidos no PDF para que o documento sirva como conferência. O PDF será gerado a partir dos mesmos dados e regras usados no card, evitando divergência entre tela e arquivo.

### Estados e erros

- Enquanto o arquivo estiver sendo montado, o botão ficará desabilitado e mostrará estado de geração.
- Se não houver movimentação, o PDF ainda será gerado com os totais zerados e uma mensagem informativa.
- Uma falha de geração será mostrada no próprio card, sem derrubar a página.
- Nomes longos e muitas comandas deverão paginar sem cortar tabelas, cabeçalhos ou totais.

## 2. Login único e rota `/plataforma`

### Fluxo aprovado

1. O usuário informa e-mail e senha em `/login`.
2. O navegador autentica uma única vez no Supabase Auth.
3. O token autenticado é enviado ao servidor exclusivamente para classificação do acesso.
4. O servidor valida o token com o Supabase Auth e consulta `platform_admins` usando credencial privada.
5. Se o usuário estiver ativo em `platform_admins`, o servidor cria a sessão administrativa HTTP-only e responde com destino `/plataforma`.
6. Caso contrário, o usuário segue para `/dashboard` com sua sessão operacional normal.

Administradores da plataforma têm precedência. Se uma conta também pertencer a uma barbearia, o login abre diretamente `/plataforma`.

### Rotas e remoções

- `/login` será a única tela de credenciais.
- O painel administrativo passa de `/admin` para `/plataforma`.
- O detalhe de conta passa de `/admin/contas/[id]` para `/plataforma/contas/[id]`.
- O formulário antigo de credenciais administrativas será removido.
- O acesso antigo em `/admin` será removido, sem manter uma segunda tela de login.
- As rotas internas de API podem continuar sob `/api/admin`, pois não são páginas visíveis e permanecem protegidas no servidor.

### Sessão e segurança

- A senha não será enviada novamente a um segundo formulário ou endpoint administrativo.
- A classificação nunca confiará em dados fornecidos pelo cliente; o servidor validará o token e consultará `platform_admins`.
- A sessão administrativa continuará em cookie `HttpOnly`, `Secure` em produção e `SameSite=Strict`.
- A revogação continuará imediata: cada operação administrativa confirma que o usuário segue ativo em `platform_admins`.
- Auditoria das ações administrativas será preservada.
- A classificação do login terá resposta genérica em falhas para evitar revelar quem é administrador.
- Usuário sem sessão que abrir `/plataforma` será encaminhado a `/login`.
- Administrador que sair terá a sessão administrativa encerrada e voltará a `/login`.

### Rate limit

Tentativas de senha continuam protegidas pelos controles do Supabase Auth, que permanece como o único serviço que recebe e valida a senha. O endpoint de classificação não aceita senha e só responde depois de validar um access token real. O rate limit administrativo legado será removido junto com o endpoint antigo de login; a classificação receberá limitação por IP para impedir abuso sem contabilizar novamente a tentativa de senha.

## Arquitetura

### PDF

- Extrair a montagem do modelo mensal para uma função pura e testável.
- Manter o componente da página responsável apenas por acionar a geração e exibir estado/erro.
- Usar geração de PDF no cliente com uma biblioteca versionada e lockfile atualizado.
- Validar o resultado por extração de texto e renderização visual de exemplos com uma e várias páginas.

### Autenticação

- Criar um endpoint de classificação autenticado por bearer token.
- Reaproveitar a criação e validação do cookie administrativo existente.
- Separar a lógica de classificação da interface de login para permitir testes unitários.
- Mover as páginas administrativas para o segmento `/plataforma` e atualizar todos os links internos.
- Remover componentes e chamadas que sustentavam o formulário administrativo separado.

## Testes e critérios de aceite

### PDF

- O botão aparece em cada funcionário do ranking mensal.
- O arquivo baixado tem nome previsível e inclui funcionário e competência corretos.
- Totais do PDF são idênticos aos totais exibidos no card.
- Comandas de valor zero mostram comissão zero.
- Um funcionário sem vendas recebe PDF válido com totais zerados.
- Documento com muitas comandas pagina corretamente e permanece legível.

### Login e plataforma

- Administrador ativo autenticado em `/login` chega a `/plataforma`.
- Usuário operacional autenticado chega a `/dashboard`.
- Conta com os dois vínculos chega a `/plataforma`.
- Usuário removido ou inativo em `platform_admins` não obtém sessão administrativa.
- `/plataforma` sem cookie válido retorna ao `/login`.
- Logout administrativo remove o cookie e retorna ao `/login`.
- Não existe formulário administrativo separado em `/admin`.
- Links e detalhes administrativos usam `/plataforma`.
- Senha inválida permanece sujeita ao rate limit e não revela o tipo de conta.

## Fora de escopo

- Escolha manual entre perfil administrativo e barbearia no login.
- PDF consolidado de toda a equipe.
- Assinatura digital ou aceite do funcionário no PDF.
- Envio automático por WhatsApp ou e-mail.
- Alteração do namespace privado `/api/admin`.
