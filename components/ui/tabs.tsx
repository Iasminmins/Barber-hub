'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TabItem {
  value: string
  label: string
}

interface TabsProps {
  items: TabItem[]
  value: string
  onValueChange: (value: string) => void
  className?: string
}

function Tabs({ items, value, onValueChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn('inline-flex items-center gap-1 rounded-lg bg-muted p-1', className)}
    >
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(item.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer',
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

export { Tabs }
