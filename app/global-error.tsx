'use client'

import * as React from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error('Erro fatal no layout raiz', { digest: error.digest, error })
  }, [error])

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: '#f7f7f5', color: '#17211d', fontFamily: 'Arial, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
          <div style={{ maxWidth: 440, border: '1px solid #deded8', borderRadius: 16, background: '#fff', padding: 32 }}>
            <h1 style={{ margin: 0, fontSize: 22 }}>O MeuBarberHub encontrou um problema</h1>
            <p style={{ margin: '12px 0 0', color: '#5f6863', lineHeight: 1.5 }}>
              Seus dados continuam seguros. Recarregue a aplicação para continuar.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{ marginTop: 20, border: 0, borderRadius: 8, background: '#1e3a32', color: '#fff', padding: '11px 18px', cursor: 'pointer', fontWeight: 700 }}
            >
              Recarregar aplicação
            </button>
            {error.digest ? <p style={{ marginTop: 16, color: '#777', fontSize: 12 }}>Código: {error.digest}</p> : null}
          </div>
        </main>
      </body>
    </html>
  )
}
