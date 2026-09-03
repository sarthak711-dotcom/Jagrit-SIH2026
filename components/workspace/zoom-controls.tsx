"use client"

import { Plus, Minus, Locate } from "lucide-react"

export function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
}: {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}) {
  return (
    <div className="flex flex-col items-stretch border border-border bg-popover/90 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Zoom in"
        onClick={onZoomIn}
        className="flex h-9 w-9 items-center justify-center border-b border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
      </button>
      <div className="flex h-8 w-9 items-center justify-center border-b border-border font-mono text-[11px] tabular-nums text-foreground">
        {zoom}
      </div>
      <button
        type="button"
        aria-label="Zoom out"
        onClick={onZoomOut}
        className="flex h-9 w-9 items-center justify-center border-b border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Minus className="h-4 w-4" strokeWidth={2} />
      </button>
      <button
        type="button"
        aria-label="Reset to initial view"
        title="Reset view"
        onClick={onReset}
        className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
      >
        <Locate className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  )
}
