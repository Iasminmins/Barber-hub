import Link from 'next/link'
import { ArrowLeft, CalendarPlus, Save } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getClients, getEmployees, getServices } from '@/lib/data'

export default function NovoAgendamentoPage() {
  const clients = getClients()
  const barbers = getEmployees().filter((employee) => employee.active && employee.role.toLowerCase().includes('barbeiro'))
  const services = getServices().filter((service) => service.active)

  return (
    <div>
      <PageHeader title="Novo agendamento" description="Escolha cliente, barbeiro, serviço, data e horário.">
        <Link href="/agenda" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
      </PageHeader>

      <form className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
            <CalendarPlus className="size-4 text-muted-foreground" />
            Dados do horário
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
              <Label htmlFor="barber">Barbeiro</Label>
              <Select id="barber" defaultValue="">
                <option value="" disabled>
                  Selecionar barbeiro
                </option>
                {barbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="service">Serviço</Label>
              <Select id="service" defaultValue="">
                <option value="" disabled>
                  Selecionar serviço
                </option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status inicial</Label>
              <Select id="status" defaultValue="agendado">
                <option value="agendado">Agendado</option>
                <option value="confirmado">Confirmado</option>
                <option value="chegou">Cliente chegou</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start">Horário</Label>
              <Input id="start" type="time" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Observações do agendamento</Label>
              <Textarea id="notes" placeholder="Preferências, atraso tolerado, aviso importante..." />
            </div>
          </div>
        </Card>

        <Card className="h-fit p-5">
          <h3 className="mb-2 font-semibold text-foreground">Confirmação</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            O cliente pode receber lembrete pelo WhatsApp quando a integração estiver ativa.
          </p>
          <Button type="button" variant="gold" className="w-full">
            <Save className="size-4" />
            Salvar agendamento
          </Button>
        </Card>
      </form>
    </div>
  )
}
