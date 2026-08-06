/**
 * POLÍTICA DE COOKIES — MINUTA.
 *
 * Os cookies descritos foram inferidos dos serviços presentes no projeto
 * (Supabase Auth para sessão, PostHog e Vercel Analytics para métricas).
 * Confirme a lista real com uma inspeção do navegador antes de publicar.
 */
import type { Metadata } from 'next'
import { LegalPage, LegalSection } from '@/components/landing/legal-page'
import { LINKS } from '@/lib/landing-content'

export const metadata: Metadata = {
  title: 'Política de cookies | MeuBarberHub',
  description: 'Como o MeuBarberHub utiliza cookies e tecnologias semelhantes.',
}

export default function CookiesPage() {
  return (
    <LegalPage
      title="Política de cookies"
      updatedAt="5 de agosto de 2026"
      intro="Esta página explica o que são cookies, quais utilizamos no MeuBarberHub e como você pode controlá-los."
    >
      <LegalSection title="1. O que são cookies">
        <p>
          Cookies são pequenos arquivos gravados no seu navegador quando você acessa um site. Eles
          permitem lembrar informações entre uma visita e outra, como manter você conectado à sua
          conta.
        </p>
      </LegalSection>

      <LegalSection title="2. Cookies essenciais">
        <p>
          São necessários para a plataforma funcionar e não podem ser desativados. Sem eles, não é
          possível manter a sessão iniciada nem proteger o acesso à conta.
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Sessão e autenticação</strong> — mantêm você conectado e identificam sua
            barbearia. Definidos pelo nosso provedor de autenticação.
          </li>
          <li>
            <strong>Segurança</strong> — ajudam a prevenir acessos indevidos e requisições
            fraudulentas.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Cookies de análise">
        <p>
          Usamos ferramentas de métricas para entender como o produto é utilizado e priorizar
          melhorias. Esses dados são analisados de forma agregada.
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>PostHog</strong> — mede navegação e uso das funcionalidades.
          </li>
          <li>
            <strong>Vercel Analytics</strong> — mede desempenho e volume de acesso das páginas.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Cookies de marketing">
        <p>
          Atualmente o MeuBarberHub <strong>não utiliza cookies de publicidade</strong>. Não há
          pixels de redes sociais nem tags de plataformas de anúncio em nosso site.
        </p>
        <p>
          Caso passemos a utilizá-los, esta política será atualizada e o carregamento desses
          cookies passará a depender do seu consentimento prévio, que poderá ser recusado ou
          revogado a qualquer momento.
        </p>
      </LegalSection>

      <LegalSection title="5. Como controlar os cookies">
        <p>
          Você pode apagar ou bloquear cookies nas configurações do seu navegador. Note que
          bloquear os cookies essenciais impede o login e o uso da plataforma.
        </p>
        <p>
          Os principais navegadores oferecem essa configuração na seção de privacidade ou de dados
          de navegação.
        </p>
      </LegalSection>

      <LegalSection title="6. Contato">
        <p>
          Dúvidas sobre esta política podem ser enviadas para{' '}
          <a className="underline underline-offset-4" href={LINKS.email}>
            {LINKS.emailLabel}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  )
}
