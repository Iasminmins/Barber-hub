import { AppShell } from '@/components/shell/app-shell'
import { AppDataProvider } from '@/components/data/app-data-provider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppDataProvider><AppShell>{children}</AppShell></AppDataProvider>
}
