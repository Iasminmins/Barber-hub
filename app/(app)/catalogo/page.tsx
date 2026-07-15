import { getCatalog } from "@/lib/data"
import { CatalogoClient } from "./catalogo-client"

export default function CatalogoPage() {
  return <CatalogoClient items={getCatalog()} />
}
