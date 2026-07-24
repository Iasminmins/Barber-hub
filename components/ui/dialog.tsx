'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

function Dialog({ open, onClose, children, className }: DialogProps) {
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 max-h-[calc(100dvh-1rem)] w-full overflow-y-auto rounded-t-2xl border border-border bg-card p-4 shadow-xl sm:max-h-[92vh] sm:max-w-lg sm:rounded-2xl sm:p-6',
          className,
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground"
          aria-label="Fechar"
        >
          <X className="size-4" />
        </Button>
        {children}
      </div>
    </div>,
    document.body,
  )
}

function DialogHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5 pr-8">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

export { Dialog, DialogHeader }
