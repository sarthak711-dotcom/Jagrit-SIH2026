"use client"

import {
  Compass,
  Search,
  Upload,
  SquareDashed,
  Layers,
  Wand2,
  Columns2,
  Gauge,
  BadgeCheck,
  BarChart3,
  Download,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type ToolId =
  | "explore"
  | "search"
  | "upload"
  | "select"
  | "layers"
  | "enhance"
  | "compare"
  | "confidence"
  | "validation"
  | "analysis"
  | "export"

type Tool = {
  id: ToolId
  label: string
  icon: LucideIcon
  enabled?: boolean
}

// Enabled tools are wired up now; the rest are reserved for the next step.
const TOOLS: Tool[] = [
  { id: "explore", label: "Explore", icon: Compass, enabled: true },
  { id: "search", label: "Search", icon: Search, enabled: true },
  { id: "upload", label: "Upload imagery", icon: Upload, enabled: true },
  { id: "select", label: "Select region", icon: SquareDashed, enabled: true },
  { id: "layers", label: "Layers", icon: Layers, enabled: true },
  { id: "enhance", label: "Enhance", icon: Wand2 },
  { id: "compare", label: "Compare", icon: Columns2 },
  { id: "confidence", label: "Confidence", icon: Gauge },
  { id: "validation", label: "Validation", icon: BadgeCheck },
  { id: "analysis", label: "Analysis", icon: BarChart3 },
  { id: "export", label: "Export", icon: Download },
]

export function Toolbar({
  active,
  onSelect,
}: {
  active: ToolId
  onSelect: (id: ToolId) => void
}) {
  return (
    <div className="flex flex-col border border-border bg-popover/90 backdrop-blur-sm">
      {TOOLS.map((tool) => {
        const Icon = tool.icon
        const isActive = active === tool.id
        const disabled = !tool.enabled
        return (
          <button
            key={tool.id}
            type="button"
            title={disabled ? `${tool.label} — coming soon` : tool.label}
            aria-label={tool.label}
            aria-pressed={isActive}
            disabled={disabled}
            onClick={() => onSelect(tool.id)}
            className={[
              "group relative flex h-9 w-9 items-center justify-center border-b border-border last:border-b-0 transition-colors",
              disabled
                ? "cursor-not-allowed text-muted-foreground/30"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
              isActive ? "bg-primary/15 text-primary" : "",
            ].join(" ")}
          >
            {isActive && <span className="absolute left-0 top-0 h-full w-0.5 bg-primary" />}
            <Icon className="h-[17px] w-[17px]" strokeWidth={1.75} />
          </button>
        )
      })}
    </div>
  )
}
