"use client"

import { Check } from "lucide-react"
import { PanelShell } from "@/components/workspace/panel-shell"

export type LayerId =
  | "satellite"
  | "falseColour"
  | "enhanced"
  | "confidence"
  | "boundaries"
  | "urban"
  | "change"

export type LayersState = Record<LayerId, boolean> & { opacity: number }

const LAYERS: { id: LayerId; label: string }[] = [
  { id: "satellite", label: "Satellite RGB" },
  { id: "falseColour", label: "False Colour" },
  { id: "enhanced", label: "Enhanced Image" },
  { id: "confidence", label: "Confidence" },
  { id: "boundaries", label: "Field Boundaries" },
  { id: "urban", label: "Urban Features" },
  { id: "change", label: "Change Detection" },
]

export function LayersPanel({
  onClose,
  layers,
  onToggle,
  onOpacity,
}: {
  onClose: () => void
  layers: LayersState
  onToggle: (id: LayerId) => void
  onOpacity: (value: number) => void
}) {
  return (
    <PanelShell title="Layers" onClose={onClose}>
      <div className="py-1">
        {LAYERS.map((layer) => {
          const on = layers[layer.id]
          return (
            <button
              key={layer.id}
              type="button"
              onClick={() => onToggle(layer.id)}
              className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left transition-colors hover:bg-accent"
            >
              <span
                className={[
                  "flex h-3.5 w-3.5 shrink-0 items-center justify-center border",
                  on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                ].join(" ")}
              >
                {on && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
              </span>
              <span
                className={[
                  "font-mono text-xs",
                  on ? "text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                {layer.label}
              </span>
            </button>
          )
        })}
      </div>
      <div className="border-t border-border px-3 py-2.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
            Opacity
          </span>
          <span className="font-mono text-[10px] tabular-nums text-foreground">
            {Math.round(layers.opacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(layers.opacity * 100)}
          onChange={(e) => onOpacity(Number(e.target.value) / 100)}
          aria-label="Layer opacity"
          className="h-1 w-full cursor-pointer appearance-none bg-border accent-primary"
        />
      </div>
    </PanelShell>
  )
}
