import Link from 'next/link'
import { ArrowLeft, PackagePlus, Save } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export default function NovoCatalogoPage() {
  return (
    <div>
      <PageHeader
        title="Novo item do catálogo"
        description="Cadastre produto ou serviço com preço, custo, comissão e parâmetros de estoque."
      >
        <Link href="/catalogo" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
      </PageHeader>

      <form className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
            <PackagePlus className="size-4 text-muted-foreground" />
            Dados do item
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select id="type" defaultValue="produto">
                <option value="produto">Produto</option>
                <option value="servico">Serviço</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input id="category" placeholder="Ex.: Barba, Cabelo, Finalização" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" placeholder="Ex.: Pomada modeladora ou Corte degradê" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Preço de venda</Label>
              <Input id="price" placeholder="R$ 0,00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Custo</Label>
              <Input id="cost" placeholder="R$ 0,00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commission">Comissão (%)</Label>
              <Input id="commission" type="number" placeholder="10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duração do serviço</Label>
              <Input id="duration" type="number" placeholder="40 min" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Estoque atual</Label>
              <Input id="stock" type="number" placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Estoque mínimo</Label>
              <Input id="minStock" type="number" placeholder="0" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Descrição interna</Label>
              <Textarea id="description" placeholder="Detalhes de execução, fornecedor, observações..." />
            </div>
          </div>
        </Card>

        <aside className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-4 font-semibold text-foreground">Disponibilidade</h3>
            <div className="space-y-3">
              {['Ativo no catálogo', 'Disponível no agendamento', 'Permite comissão'].map((label) => (
                <label key={label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <input type="checkbox" defaultChecked className="size-4 accent-[var(--primary)]" />
                </label>
              ))}
            </div>
          </Card>
          <Button type="button" variant="gold" className="w-full">
            <Save className="size-4" />
            Salvar item
          </Button>
        </aside>
      </form>
    </div>
  )
}
