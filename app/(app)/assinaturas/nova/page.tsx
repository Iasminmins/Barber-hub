'use client'

import Link from 'next/link'
import { ArrowLeft, CreditCard, Edit3, Save } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useAppData } from '@/components/data/app-data-provider'

export default function NovaAssinaturaPage() {
  const { clients, plans: databasePlans } = useAppData()
  const plans = databasePlans.filter((plan) => plan.active)

  return (
    <div>
      <PageHeader title="Nova assinatura" description="Associe um cliente a um plano recorrente, pacote ou crédito.">
        <Link href="/assinaturas" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
      </PageHeader>

      <form className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
            <CreditCard className="size-4 text-muted-foreground" />
            Dados da assinatura
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Select id="client" defaultValue="">
                <option value="" disabled>
                  Selecionar cliente
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="plan">Plano</Label>
                <Link href="/assinaturas?tab=planos#planos" className="text-xs font-semibold text-primary hover:underline">
                  criar/editar planos
                </Link>
              </div>
              <Select id="plan" defaultValue="">
                <option value="" disabled>
                  Selecionar plano
                </option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Início</Label>
              <Input id="startDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Próximo vencimento</Label>
              <Input id="dueDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Valor negociado</Label>
              <Input id="price" placeholder="R$ 0,00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" defaultValue="ativo">
                <option value="ativo">Ativo</option>
                <option value="vencendo">Vencendo</option>
                <option value="vencido">Vencido</option>
              </Select>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-2 font-semibold text-foreground">Onde escrevo os planos?</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Clique abaixo para abrir diretamente a aba Planos, onde ficam os campos de nome, valor, tipo, créditos e descrição.
            </p>
            <Link href="/assinaturas?tab=planos#planos" className={buttonVariants({ variant: 'outline', className: 'w-full' })}>
              <Edit3 className="size-4" />
              Abrir editor de planos
            </Link>
          </Card>
          <Card className="p-5">
            <h3 className="mb-2 font-semibold text-foreground">Cobrança</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Use o vencimento para alimentar alertas de renovação e notificações da plataforma.
            </p>
            <Button type="button" variant="gold" className="w-full">
              <Save className="size-4" />
              Salvar assinatura
            </Button>
          </Card>
        </div>
      </form>
    </div>
  )
}
