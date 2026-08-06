/**
 * POLÍTICA DE PRIVACIDADE — MINUTA.
 *
 * Os operadores citados (Supabase, Asaas, Resend, PostHog, Vercel) foram
 * identificados a partir das variáveis de ambiente e do código do projeto.
 * Confirme se a lista está completa antes de publicar e peça revisão jurídica —
 * este documento tem efeitos legais sob a LGPD.
 */
import type { Metadata } from 'next'
import { LegalPage, LegalSection } from '@/components/landing/legal-page'
import { LINKS } from '@/lib/landing-content'

export const metadata: Metadata = {
  title: 'Política de privacidade | MeuBarberHub',
  description: 'Como o MeuBarberHub coleta, usa e protege dados pessoais.',
}

export default function PrivacidadePage() {
  return (
    <LegalPage
      title="Política de privacidade"
      updatedAt="5 de agosto de 2026"
      intro="Esta política explica quais dados pessoais tratamos, por que tratamos e quais são os seus direitos, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018)."
    >
      <LegalSection title="1. Controlador dos dados">
        <p>
          O controlador é <strong>60.355.279 IASMIN DE OLIVEIRA DIAS LAGE</strong>,
          microempreendedora individual inscrita no CNPJ <strong>60.355.279/0001-58</strong>, com
          sede na Rua Nove, 115, Santa Clara, Barra Mansa/RJ, CEP 27340-370.
        </p>
        <p>
          Por se tratar de agente de tratamento de pequeno porte, nos termos da Resolução CD/ANPD
          nº 2/2022, não há encarregado formalmente indicado. O canal de comunicação para assuntos
          de privacidade é{' '}
          <a className="underline underline-offset-4" href={LINKS.email}>
            {LINKS.emailLabel}
          </a>
          .
        </p>
        <p>
          Quando a barbearia cadastra dados dos seus próprios clientes na plataforma, ela atua como
          controladora desses dados e o MeuBarberHub como operador.
        </p>
      </LegalSection>

      <LegalSection title="2. Dados que coletamos">
        <p>
          <strong>Dados de cadastro:</strong> nome, e-mail, telefone e informações da barbearia,
          fornecidos por você ao criar a conta.
        </p>
        <p>
          <strong>Dados de operação:</strong> informações inseridas durante o uso — clientes,
          agendamentos, serviços, comandas, produtos, planos e lançamentos financeiros.
        </p>
        <p>
          <strong>Dados de pagamento:</strong> tratados pela instituição financeira parceira. Não
          armazenamos números completos de cartão em nossos servidores.
        </p>
        <p>
          <strong>Dados de uso:</strong> páginas acessadas, ações realizadas na plataforma e
          informações técnicas do dispositivo e do navegador.
        </p>
      </LegalSection>

      <LegalSection title="3. Por que tratamos esses dados">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Execução do contrato:</strong> criar e manter sua conta, disponibilizar as
            funcionalidades contratadas e processar cobranças.
          </li>
          <li>
            <strong>Obrigação legal:</strong> guarda de registros fiscais e de acesso exigidos por
            lei.
          </li>
          <li>
            <strong>Legítimo interesse:</strong> segurança da plataforma, prevenção a fraudes e
            melhoria do produto a partir de dados de uso.
          </li>
          <li>
            <strong>Consentimento:</strong> comunicações de marketing e cookies não essenciais, que
            você pode recusar a qualquer momento.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Com quem compartilhamos">
        <p>
          Não vendemos dados pessoais. Compartilhamos apenas com prestadores necessários à operação
          do serviço, que tratam os dados sob nossa instrução:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Supabase</strong> — banco de dados, autenticação e armazenamento.
          </li>
          <li>
            <strong>Vercel</strong> — hospedagem da aplicação.
          </li>
          <li>
            <strong>Asaas</strong> — processamento de cobranças e assinaturas.
          </li>
          <li>
            <strong>Resend</strong> — envio de e-mails transacionais.
          </li>
          <li>
            <strong>PostHog</strong> — métricas de uso do produto.
          </li>
        </ul>
        <p>
          Alguns desses serviços podem processar dados fora do Brasil. Nesses casos, a transferência
          internacional observa as salvaguardas previstas na LGPD.
        </p>
      </LegalSection>

      <LegalSection title="5. Por quanto tempo guardamos">
        <p>
          Mantemos os dados enquanto a conta estiver ativa. Após o encerramento, os dados
          permanecem armazenados e podem ser solicitados por você a qualquer momento, sendo
          eliminados quando deixarem de ser necessários ou mediante seu pedido expresso.
        </p>
        <p>
          Registros fiscais e de pagamento são conservados por 5 anos, prazo exigido pela
          legislação tributária, ainda que a conta tenha sido encerrada antes disso.
        </p>
      </LegalSection>

      <LegalSection title="6. Segurança">
        <p>Adotamos as seguintes medidas para proteger os dados:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>transmissão criptografada entre o navegador e nossos servidores (TLS/HTTPS);</li>
          <li>criptografia dos dados em repouso no banco de dados (AES-256);</li>
          <li>
            isolamento por barbearia com políticas de acesso no próprio banco, de modo que uma
            conta não alcança os dados de outra;
          </li>
          <li>controle de permissões por perfil de usuário (proprietário, gerente e equipe);</li>
          <li>acesso a dados de pagamento restrito à instituição financeira parceira.</li>
        </ul>
        <p>
          Nenhum sistema é totalmente imune a incidentes. Caso ocorra um incidente de segurança com
          risco relevante aos titulares, comunicaremos os afetados e a Autoridade Nacional de
          Proteção de Dados pelos canais indicados nesta política.
        </p>
      </LegalSection>

      <LegalSection title="7. Seus direitos">
        <p>A LGPD garante a você o direito de:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>confirmar a existência de tratamento e acessar seus dados;</li>
          <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
          <li>solicitar anonimização, bloqueio ou eliminação de dados desnecessários;</li>
          <li>solicitar a portabilidade dos dados;</li>
          <li>revogar o consentimento;</li>
          <li>opor-se a tratamento feito com base em legítimo interesse.</li>
        </ul>
        <p>
          Para exercer qualquer um deles, escreva para{' '}
          <a className="underline underline-offset-4" href={LINKS.email}>
            {LINKS.emailLabel}
          </a>
          . Respondemos no prazo previsto em lei.
        </p>
      </LegalSection>

      <LegalSection title="8. Cookies">
        <p>
          O uso de cookies está descrito em detalhe na nossa{' '}
          <a className="underline underline-offset-4" href="/cookies">
            Política de cookies
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="9. Alterações desta política">
        <p>
          Podemos atualizar esta política. Mudanças relevantes serão comunicadas por e-mail ou
          dentro da plataforma antes de entrarem em vigor.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
