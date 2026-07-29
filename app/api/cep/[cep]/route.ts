import { NextResponse } from 'next/server'

type ViaCepResponse = {
  erro?: boolean
  cep?: string
  logradouro?: string
  complemento?: string
  bairro?: string
  localidade?: string
  uf?: string
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cep: string }> },
) {
  const { cep: rawCep } = await params
  const cep = rawCep.replace(/\D/g, '')

  if (!/^\d{8}$/.test(cep)) {
    return NextResponse.json({ error: 'Informe um CEP com 8 dígitos.' }, { status: 400 })
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 86400 },
    })
    if (!response.ok) {
      return NextResponse.json({ error: 'Não foi possível consultar o CEP.' }, { status: 502 })
    }

    const data = await response.json() as ViaCepResponse
    if (data.erro) {
      return NextResponse.json({ error: 'CEP não encontrado.' }, { status: 404 })
    }

    return NextResponse.json({
      cep: data.cep ?? '',
      street: data.logradouro ?? '',
      complement: data.complemento ?? '',
      neighborhood: data.bairro ?? '',
      city: data.localidade ?? '',
      state: data.uf ?? '',
    })
  } catch {
    return NextResponse.json(
      { error: 'A consulta de CEP está indisponível. Preencha o endereço manualmente.' },
      { status: 502 },
    )
  }
}
