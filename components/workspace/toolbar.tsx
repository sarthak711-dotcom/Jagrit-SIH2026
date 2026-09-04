"use client"

import {
  Compass,
  Search,
  Upload,
  SquareDashed,
  Layers,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type ToolId =
  | "explore"
  | "search"
  | "upload"
  | "select"
  | "layers"

type Tool = {
  id: ToolId
  label: string
  icon: LucideIcon
}

const TOOLS: Tool[] = [
  { id: "explore", label: "Explore Map", icon: Compass },
  { id: "search", label: "Search Location", icon: Search },
  { id: "upload", label: "Upload Imagery", icon: Upload },
  { id: "select", label: "Select Region (ROI)", icon: SquareDashed },
  { id: "layers", label: "Map Layers", icon: Layers },
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
        return (
          <button
            key={tool.id}
            type="button"
            title={tool.label}
            aria-label={tool.label}
            aria-pressed={isActive}
            onClick={() => onSelect(tool.id)}
            className={[
              "group relative flex h-9 w-9 items-center justify-center border-b border-border last:border-b-0 transition-colors text-muted-foreground hover:bg-accent hover:text-foreground",
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
