import { MessageCircle } from 'lucide-react'
import { BenefitsSection } from '@/components/landing/benefits-section'
import { FaqSection } from '@/components/landing/faq-section'
import { FinalCta } from '@/components/landing/final-cta'
import { Hero } from '@/components/landing/hero'
import { PricingSection } from '@/components/landing/pricing-section'
import { ProblemSection } from '@/components/landing/problem-section'
import { ProductTour } from '@/components/landing/product-tour'
import { SiteFooter } from '@/components/landing/site-footer'
import { SiteHeader } from '@/components/landing/site-header'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { TrustBar } from '@/components/landing/trust-bar'
import { WorkflowSection } from '@/components/landing/workflow-section'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <TrustBar />

      <ProblemSection />

      <ProductTour />

      <WorkflowSection />

      <BenefitsSection />

      <PricingSection />

      <TestimonialsSection />

      <FaqSection />

      <FinalCta />

      <SiteFooter />

      <a href="https://wa.me/5524998369828?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20o%20MeuBarberHub." target="_blank" rel="noreferrer" aria-label="Fale conosco pelo WhatsApp" className="fixed bottom-5 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-[#10251f] shadow-xl shadow-black/20 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:bottom-6 sm:right-6">
        <MessageCircle className="size-5" /><span className="hidden sm:inline">Fale conosco</span>
      </a>
    </main>
  )
}
