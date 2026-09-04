"use client"

import type { ToolId } from "@/components/workspace/toolbar"

const TOOL_LABEL: Record<ToolId, string> = {
  explore: "EXPLORE",
  search: "SEARCH",
  upload: "UPLOAD",
  select: "SELECT",
  layers: "LAYERS",
}

function fmt(n: number, pad = 3) {
  const sign = n < 0 ? "-" : " "
  const abs = Math.abs(n).toFixed(5)
  const [int, dec] = abs.split(".")
  return `${sign}${int.padStart(pad, "0")}.${dec}`
}

export function StatusBar({
  cursor,
  zoom,
  tool,
  imageLoaded,
}: {
  cursor: { lat: number; lng: number } | null
  zoom: number
  tool: ToolId
  imageLoaded: boolean
}) {
  return (
    <footer className="absolute inset-x-0 bottom-0 z-20 flex items-stretch justify-between border-t border-border bg-popover/90 font-mono text-[11px] text-muted-foreground backdrop-blur-sm">
      <div className="flex items-stretch">
        <Cell label="Mode">
          <span className="text-foreground">{TOOL_LABEL[tool]}</span>
        </Cell>
        <Cell label="Lat">
          <span className="tabular-nums text-foreground">
            {cursor ? fmt(cursor.lat, 2) : "  --.-----"}
          </span>
        </Cell>
        <Cell label="Lng">
          <span className="tabular-nums text-foreground">
            {cursor ? fmt(cursor.lng, 3) : "  ---.-----"}
          </span>
        </Cell>
      </div>
      <div className="flex items-stretch">
        <Cell label="Zoom">
          <span className="tabular-nums text-foreground">{zoom}</span>
        </Cell>
        <Cell label="Res">
          <span className="text-foreground">10 m/px</span>
        </Cell>
        <Cell label="Source">
          <span className={imageLoaded ? "text-primary" : "text-foreground"}>
            {imageLoaded ? "Sentinel-2 · Loaded" : "Sentinel-2 L2A"}
          </span>
        </Cell>
        <Cell label="CRS">
          <span className="text-foreground">EPSG:3857</span>
        </Cell>
      </div>
    </footer>
  )
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-r border-border px-3 py-1.5 last:border-r-0">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{label}</span>
      {children}
    </div>
  )
}
