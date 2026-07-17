'use client'

import { useAppData } from "@/components/data/app-data-provider"
import { ClientesClient } from "./clientes-client"

export default function ClientesPage() {
  return <ClientesClient clients={useAppData().clients} />
}
