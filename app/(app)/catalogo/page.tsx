'use client'

import { useAppData } from "@/components/data/app-data-provider"
import { CatalogoClient } from "./catalogo-client"

export default function CatalogoPage() {
  return <CatalogoClient items={useAppData().catalog} />
}
