import Link from 'next/link'
import { ArrowLeft, Minus, Plus, Receipt, Save } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { getCatalog, getClients, getEmployees } from '@/lib/data'
import { formatCurrency } from '@/lib/format'

export default function NovaComandaPage() {
  const clients = getClients()
  const employees = getEmployees().filter((employee) => employee.active)
  const items = getCatalog().filter((item) => item.active).slice(0, 5)
  const subtotal = items.slice(0, 2).reduce((sum, item) => sum + item.price, 0)

  return (
    <div>
      <PageHeader
        title="Nova comanda"
        description="Monte a venda do balcão com cliente, responsável, itens e forma de pagamento."
      >
        <Link href="/comandas" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
      </PageHeader>

      <form className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <Receipt className="size-4 text-muted-foreground" />
              Atendimento
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client">Cliente</Label>
                <Select id="client" defaultValue={clients[0]?.id}>
                  <option value="">Cliente avulso</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee">Responsável</Label>
                <Select id="employee" defaultValue={employees[0]?.id}>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-border p-5">
              <h2 className="font-semibold text-foreground">Itens da comanda</h2>
            </div>
            <div className="divide-y divide-border">
              {items.map((item, index) => (
                <div key={item.id} className="flex flex-wrap items-center gap-3 p-4">
                  <Badge variant={item.type === 'servico' ? 'default' : 'gold'}>
                    {item.type === 'servico' ? 'Serviço' : 'Produto'}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="outline" size="icon-sm" aria-label="Diminuir quantidade">
                      <Minus className="size-4" />
                    </Button>
                    <Input className="h-8 w-14 text-center" defaultValue={index < 2 ? 1 : 0} />
                    <Button type="button" variant="outline" size="icon-sm" aria-label="Aumentar quantidade">
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <span className="w-24 text-right font-semibold tabular-nums">
                    {formatCurrency(item.price)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-4 font-semibold text-foreground">Resumo</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Desconto</span>
                <span className="font-medium text-foreground">{formatCurrency(0)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-foreground">{formatCurrency(subtotal)}</span>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <div className="mb-4 space-y-2">
              <Label htmlFor="method">Pagamento</Label>
              <Select id="method" defaultValue="pix">
                <option value="pix">Pix</option>
                <option value="credito">Crédito</option>
                <option value="debito">Débito</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="pendente">Marcar como pendente</option>
              </Select>
            </div>
            <Button type="button" variant="gold" className="w-full">
              <Save className="size-4" />
              Salvar comanda
            </Button>
          </Card>
        </aside>
      </form>
    </div>
  )
}
