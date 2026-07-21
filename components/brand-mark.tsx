'use client'

import { Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type BrandMarkProps = {
  name: string
  color?: string
  logoUrl?: string
  className?: string
  imageClassName?: string
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!parts.length) return 'BH'
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export function BrandMark({ name, color = '#1E3A32', logoUrl, className, imageClassName }: BrandMarkProps) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-lg text-sm font-bold text-white shadow-sm',
        className,
      )}
      style={{ backgroundColor: logoUrl ? undefined : color }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`Logo ${name || 'da barbearia'}`}
          className={cn('size-full object-cover', imageClassName)}
        />
      ) : name ? (
        getInitials(name)
      ) : (
        <Building2 className="size-4" />
      )}
    </span>
  )
}
