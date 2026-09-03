"use client"

import { useState } from "react"
import { Search, Loader2 } from "lucide-react"

// Matches "lat, lng" or "lat lng" coordinate input
const COORD_RE = /^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/

export function SearchBar({
  onLocate,
}: {
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
      const lat = Number.parseFloat(coord[1])
      const lng = Number.parseFloat(coord[2])
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        onLocate(lat, lng, 13)
        return
      }
      setError("Coordinates out of range")
      return
    }

    // Geocode place names via Nominatim
    setLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { Accept: "application/json" } },
      )
      const data = (await res.json()) as Array<{ lat: string; lon: string }>
      if (data.length > 0) {
        onLocate(Number.parseFloat(data[0].lat), Number.parseFloat(data[0].lon), 12)
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
    <form
      onSubmit={submit}
      className="pointer-events-auto flex w-[min(46vw,360px)] flex-col"
    >
      <div className="flex items-center border border-border bg-popover/90 backdrop-blur-sm focus-within:border-primary/70">
        <span className="flex h-9 w-9 items-center justify-center text-muted-foreground">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" strokeWidth={1.75} />
          )}
        </span>
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (error) setError(null)
          }}
          placeholder="Search place or lat, lng"
          spellCheck={false}
          className="h-9 w-full bg-transparent pr-3 font-mono text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
        />
      </div>
      {error && (
        <span className="mt-1 self-end border border-destructive/40 bg-popover/90 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-destructive">
          {error}
        </span>
      )}
    </form>
  )
}
