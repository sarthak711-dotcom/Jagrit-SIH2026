"use client"

import { useState } from "react"
import { Search, Loader2, MapPin } from "lucide-react"
import { PanelShell } from "@/components/workspace/panel-shell"

// Matches "lat, lng", with optional N/S/E/W hemisphere suffixes and degree signs.
const COORD_RE =
  /^\s*(-?\d+(?:\.\d+)?)\s*°?\s*([NSns])?\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*°?\s*([EWew])?\s*$/

const RECENTS = [
  { label: "Bhubaneswar, Odisha", lat: 20.2961, lng: 85.8245 },
  { label: "Cuttack, Odisha", lat: 20.4625, lng: 85.8828 },
  { label: "Chilika Lake", lat: 19.716, lng: 85.316 },
]

export function SearchPanel({
  onClose,
  onLocate,
}: {
  onClose: () => void
  onLocate: (lat: number, lng: number, zoom?: number) => void
}) {
  const [value, setValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const query = value.trim()
    if (!query) return
    setError(null)

    const coord = query.match(COORD_RE)
    if (coord) {
      let lat = Number.parseFloat(coord[1])
      let lng = Number.parseFloat(coord[3])
      if (coord[2]?.toUpperCase() === "S") lat = -Math.abs(lat)
      if (coord[4]?.toUpperCase() === "W") lng = -Math.abs(lng)
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        onLocate(lat, lng, 14)
        return
      }
      setError("Coordinates out of range")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { Accept: "application/json" } },
      )
      const data = (await res.json()) as Array<{ lat: string; lon: string }>
      if (data.length > 0) {
        onLocate(Number.parseFloat(data[0].lat), Number.parseFloat(data[0].lon), 13)
      } else {
        setError("No results")
      }
    } catch {
      setError("Search failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <PanelShell title="Search" onClose={onClose}>
      <form onSubmit={submit} className="border-b border-border p-3">
        <div className="flex items-center border border-border bg-input focus-within:border-primary/70">
          <span className="flex h-8 w-8 items-center justify-center text-muted-foreground">
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
            )}
          </span>
          <input
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (error) setError(null)
            }}
            placeholder="Location or coordinates"
            spellCheck={false}
            className="h-8 w-full bg-transparent pr-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
        </div>
        <p className="mt-1.5 font-mono text-[10px] text-muted-foreground/50">
          e.g. Bhubaneswar, Odisha · 20.2961° N, 85.8245° E
        </p>
        {error && (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-destructive">
            {error}
          </p>
        )}
      </form>

      <div className="py-1">
        <p className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">
          Recent
        </p>
        {RECENTS.map((r) => (
          <button
            key={r.label}
            type="button"
            onClick={() => onLocate(r.lat, r.lng, 13)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-accent"
          >
            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" strokeWidth={1.75} />
            <span className="truncate font-mono text-xs text-foreground">{r.label}</span>
          </button>
        ))}
      </div>
    </PanelShell>
  )
}
