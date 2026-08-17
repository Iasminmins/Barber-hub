import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { MetaPixel } from '@/components/meta-pixel'
import './globals.css'

export const metadata: Metadata = {
  title: 'MeuBarberHub | Sistema de gestão para barbearias',
  description:
    'Organize agenda, comandas, clientes, planos, estoque e financeiro da sua barbearia. Teste o MeuBarberHub grátis por 30 dias.',
  icons: {
    icon: [{ url: '/icon-light-32x32.png', type: 'image/png' }],
    apple: '/apple-icon.png',
    shortcut: '/icon-light-32x32.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
  themeColor: '#1E3A32',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="bg-background">
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
        {process.env.NODE_ENV === 'production' && <MetaPixel />}
      </body>
    </html>
  )
}
