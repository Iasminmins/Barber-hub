import { getClients } from "@/lib/data"
import { ClientesClient } from "./clientes-client"

export default function ClientesPage() {
  return <ClientesClient clients={getClients()} />
}
