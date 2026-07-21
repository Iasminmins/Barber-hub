import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string
  src?: string
  color?: string
}

function initials(name?: string) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

function Avatar({ className, name, src, color, style, ...props }: AvatarProps) {
  const colorStyle = color && !src
    ? {
        backgroundColor: `${color}1A`,
        color,
        ...style,
      }
    : style

  return (
    <div
      className={cn(
        'relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary',
        className,
      )}
      style={colorStyle}
      {...props}
    >
      {src ? (
        <Image src={src} alt={name ?? ''} fill sizes="36px" className="object-cover" />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  )
}

export { Avatar }
