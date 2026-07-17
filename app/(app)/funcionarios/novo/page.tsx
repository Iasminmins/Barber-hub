import Link from 'next/link'
import { ArrowLeft, Save, UserCog } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

export default function NovoFuncionarioPage() {
  return (
    <div>
      <PageHeader title="Novo funcionário" description="Cadastre equipe, função, contato e regras de comissão.">
        <Link href="/funcionarios" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
      </PageHeader>

      <form className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
            <UserCog className="size-4 text-muted-foreground" />
            Dados do funcionário
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" placeholder="Ex.: Nome do funcionário" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select id="role" defaultValue="barber">
                <option value="barber">Barbeiro</option>
                <option value="manager">Gerente</option>
                <option value="reception">Recepção</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="funcionario@barberhub.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" placeholder="(11) 99999-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="active">Status</Label>
              <Select id="active" defaultValue="active">
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceCommission">Comissão em serviços (%)</Label>
              <Input id="serviceCommission" type="number" placeholder="45" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productCommission">Comissão em produtos (%)</Label>
              <Input id="productCommission" type="number" placeholder="10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscriptionCommission">Comissão em assinaturas (%)</Label>
              <Input id="subscriptionCommission" type="number" placeholder="15" />
            </div>
          </div>
        </Card>

        <Card className="h-fit p-5">
          <h3 className="mb-2 font-semibold text-foreground">Permissões iniciais</h3>
          <div className="mb-4 space-y-3">
            {['Agenda', 'Comandas', 'Clientes', 'Financeiro'].map((permission, index) => (
              <label key={permission} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{permission}</span>
                <input type="checkbox" defaultChecked={index < 3} className="size-4 accent-[var(--primary)]" />
              </label>
            ))}
          </div>
          <Button type="button" variant="gold" className="w-full">
            <Save className="size-4" />
            Salvar funcionário
          </Button>
        </Card>
      </form>
    </div>
  )
}
