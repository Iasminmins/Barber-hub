import Link from 'next/link'
import { ArrowLeft, Save, UserPlus } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export default function NovoClientePage() {
  return (
    <div>
      <PageHeader
        title="Novo cliente"
        description="Cadastre dados de contato, preferências e observações para relacionamento."
      >
        <Link href="/clientes" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
      </PageHeader>

      <form className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
            <UserPlus className="size-4 text-muted-foreground" />
            Dados do cliente
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" placeholder="Ex.: João Henrique Silva" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <Input id="phone" placeholder="(11) 99999-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="cliente@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de nascimento</Label>
              <Input id="birthDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredBarber">Barbeiro preferido</Label>
              <Select id="preferredBarber" defaultValue="">
                <option value="" disabled>
                  Selecionar barbeiro
                </option>
                <option>Rafael Moura</option>
                <option>Diego Santos</option>
                <option>Bruno Lima</option>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" placeholder="Rua, número, bairro" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Preferências de corte, alergias, histórico importante..."
                className="min-h-28"
              />
            </div>
          </div>
        </Card>

        <aside className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-4 font-semibold text-foreground">Classificação</h3>
            <div className="space-y-3">
              {['VIP', 'Recorrente', 'Aniversariante', 'Inadimplente'].map((tag) => (
                <label key={tag} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{tag}</span>
                  <input type="checkbox" className="size-4 accent-[var(--primary)]" />
                </label>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="mb-2 font-semibold text-foreground">Próximo passo</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Após salvar, o cliente fica disponível para agendamento, comanda e assinatura.
            </p>
            <Button type="button" variant="gold" className="w-full">
              <Save className="size-4" />
              Salvar cliente
            </Button>
          </Card>
        </aside>
      </form>
    </div>
  )
}
