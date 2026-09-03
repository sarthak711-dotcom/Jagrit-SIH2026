"use client"

import { X } from "lucide-react"
import type { ReactNode } from "react"

export function PanelShell({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="w-64 border border-border bg-popover/95 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {title}
        </span>
        <button
          type="button"
          aria-label="Close panel"
          onClick={onClose}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {children}
    </div>
  )
}

// Compact key/value metadata row used across panels.
export function MetaRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-3 py-1.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
        {label}
      </span>
      <span className="text-right font-mono text-xs tabular-nums text-foreground">{value}</span>
    </div>
  )
}
