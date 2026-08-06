/**
 * TERMOS DE USO — MINUTA.
 *
 * Redigido a partir do que é verificável no próprio código (planos, teste
 * grátis, cobrança via Asaas, contato de suporte). NÃO substitui revisão
 * jurídica. Antes de publicar, substitua os marcadores em CAIXA ALTA entre
 * colchetes pelos dados reais da empresa e peça revisão de um advogado.
 */
import type { Metadata } from 'next'
import { LegalPage, LegalSection } from '@/components/landing/legal-page'
import { LINKS } from '@/lib/landing-content'

export const metadata: Metadata = {
  title: 'Termos de uso | MeuBarberHub',
  description: 'Condições de uso da plataforma MeuBarberHub.',
}

export default function TermosPage() {
  return (
    <LegalPage
      title="Termos de uso"
      updatedAt="5 de agosto de 2026"
      intro="Estas condições regem o uso da plataforma MeuBarberHub. Ao criar uma conta, você concorda com os termos descritos abaixo."
    >
      <LegalSection title="1. Quem somos">
        <p>
          O MeuBarberHub é uma plataforma de gestão para barbearias, operada por{' '}
          <strong>60.355.279 IASMIN DE OLIVEIRA DIAS LAGE</strong>, microempreendedora individual
          inscrita no CNPJ <strong>60.355.279/0001-58</strong>, com sede na Rua Nove, 115, Santa
          Clara, Barra Mansa/RJ, CEP 27340-370.
        </p>
        <p>
          Contato oficial:{' '}
          <a className="underline underline-offset-4" href={LINKS.email}>
            {LINKS.emailLabel}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Cadastro e conta">
        <p>
          Para usar a plataforma é necessário criar uma conta com dados verdadeiros e mantê-los
          atualizados. Você é responsável por preservar a confidencialidade das suas credenciais e
          por toda atividade realizada com elas.
        </p>
        <p>
          O titular da conta pode conceder acesso a membros da equipe. As ações realizadas por esses
          usuários são de responsabilidade do titular.
        </p>
      </LegalSection>

      <LegalSection title="3. Teste grátis">
        <p>
          Novos usuários têm 30 dias de teste gratuito, sem necessidade de cartão de crédito.
          Nenhuma cobrança é realizada durante esse período.
        </p>
        <p>
          Ao final do teste, o acesso continua mediante contratação de um dos planos disponíveis.
          Não há cobrança automática sem que você contrate um plano.
        </p>
      </LegalSection>

      <LegalSection title="4. Planos, cobrança e cancelamento">
        <p>
          Os planos são mensais e seus valores e limites estão descritos na página de planos. Os
          pagamentos são processados por meio de instituição financeira parceira.
        </p>
        <p>
          Você pode cancelar a assinatura a qualquer momento, sem multa e sem prazo de fidelidade,
          diretamente na plataforma, em Configurações → Assinatura BarberHub. O cancelamento também
          pode ser solicitado pelo WhatsApp ou pelo e-mail de suporte.
        </p>
        <p>
          Ao cancelar, não são geradas novas cobranças. O acesso permanece disponível até o fim do
          período já pago, sem reembolso proporcional dos dias restantes. Encerrado esse período, o
          acesso operacional é suspenso, mas os dados permanecem armazenados.
        </p>
        <p>
          Alterações de preço serão comunicadas previamente e não se aplicam ao ciclo já pago.
        </p>
      </LegalSection>

      <LegalSection title="5. Uso aceitável">
        <p>Ao usar a plataforma, você concorda em não:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>utilizar o serviço para qualquer finalidade ilícita;</li>
          <li>tentar obter acesso não autorizado a contas ou sistemas;</li>
          <li>interferir no funcionamento da plataforma ou sobrecarregá-la intencionalmente;</li>
          <li>inserir dados de terceiros sem base legal para tratá-los.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Seus dados e conteúdo">
        <p>
          Os dados que você insere na plataforma — clientes, atendimentos, produtos e registros
          financeiros — continuam sendo seus. Utilizamos essas informações apenas para operar o
          serviço, conforme a Política de Privacidade.
        </p>
        <p>
          Você pode solicitar uma cópia dos seus dados a qualquer momento pelos canais de suporte.
          Após o encerramento da conta, os dados permanecem armazenados e disponíveis para
          solicitação de cópia, sendo eliminados quando deixarem de ser necessários ou mediante seu
          pedido expresso, ressalvados os registros que a legislação obriga a conservar.
        </p>
      </LegalSection>

      <LegalSection title="7. Disponibilidade do serviço">
        <p>
          Trabalhamos para manter a plataforma disponível de forma contínua, mas o serviço pode ser
          interrompido para manutenção, atualizações ou por fatores fora do nosso controle.
        </p>
        <p>
          Não há compromisso formal de disponibilidade (SLA) nem prazo contratual de resposta do
          suporte. Atendemos pelos canais informados no menor prazo possível, mas sem garantia de
          percentual de tempo no ar ou de tempo máximo de retorno.
        </p>
      </LegalSection>

      {/*
        NOTA PARA REVISÃO JURÍDICA:
        Esta seção contém apenas a delimitação factual do que a ferramenta faz.
        NÃO há cláusula de limitação de valor de indenização, porque uma cláusula
        mal redigida é nula perante o CDC — pior do que a ausência dela.
        Peça ao advogado que redija esse trecho e acrescente aqui.
      */}
      <LegalSection title="8. Limitação de responsabilidade">
        <p>
          A plataforma é uma ferramenta de apoio à gestão. As decisões comerciais, fiscais e
          trabalhistas tomadas a partir das informações registradas são de responsabilidade do
          contratante.
        </p>
        <p>
          Não nos responsabilizamos pela veracidade dos dados inseridos pelo contratante nem pelo
          uso que ele faz das informações geradas pelo sistema.
        </p>
      </LegalSection>

      <LegalSection title="9. Encerramento">
        <p>
          Você pode encerrar sua conta a qualquer momento. Podemos suspender o acesso em caso de
          violação destes termos ou de inadimplência, mediante comunicação prévia sempre que
          possível.
        </p>
      </LegalSection>

      <LegalSection title="10. Alterações destes termos">
        <p>
          Estes termos podem ser atualizados. Mudanças relevantes serão comunicadas por e-mail ou
          dentro da plataforma antes de entrarem em vigor.
        </p>
      </LegalSection>

      <LegalSection title="11. Foro e legislação aplicável">
        <p>
          Estes termos são regidos pela legislação brasileira. Fica eleito o foro da comarca de{' '}
          <strong>Barra Mansa/RJ</strong> para dirimir eventuais controvérsias.
        </p>
      </LegalSection>

      <LegalSection title="12. Contato">
        <p>
          Dúvidas sobre estes termos podem ser enviadas para{' '}
          <a className="underline underline-offset-4" href={LINKS.email}>
            {LINKS.emailLabel}
          </a>{' '}
          ou pelo WhatsApp {LINKS.phoneLabel}.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
