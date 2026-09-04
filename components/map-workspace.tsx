"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Map as LeafletMap, Rectangle, TileLayer, LatLngBounds, ImageOverlay } from "leaflet"
import "leaflet/dist/leaflet.css"
import { Toolbar, type ToolId } from "@/components/workspace/toolbar"
import { ZoomControls } from "@/components/workspace/zoom-controls"
import { StatusBar } from "@/components/workspace/status-bar"
import { SearchPanel } from "@/components/workspace/panels/search-panel"
import { UploadPanel, type UploadedImage } from "@/components/workspace/panels/upload-panel"
import { LayersPanel, type LayerId, type LayersState } from "@/components/workspace/panels/layers-panel"
import { RegionPanel, type RegionInfo } from "@/components/workspace/panels/region-panel"
import { SuperResModal, type SuperResResult } from "@/components/workspace/super-res-modal"
import { TemporalChangeModal, type TemporalResult } from "@/components/workspace/temporal-modal"

const INITIAL_CENTER: [number, number] = [20.2961, 85.8245] // Bhubaneswar S2 Demo Region
const INITIAL_ZOOM = 13
const BHUBANESWAR: [number, number] = [20.2961, 85.8245]

const BACKEND_URLS = [
  "http://127.0.0.1:8000",
  "http://localhost:8000",
  "http://127.0.0.1:8001",
  "http://localhost:8001"
]

const DEFAULT_LAYERS: LayersState = {
  satellite: true,
  falseColour: false,
  enhanced: false,
  confidence: false,
  boundaries: false,
  urban: false,
  change: false,
  opacity: 1,
}

// Rough area estimate (km²) using an equirectangular approximation.
function estimateArea(b: LatLngBounds) {
  const latMid = ((b.getNorth() + b.getSouth()) / 2) * (Math.PI / 180)
  const dLat = (b.getNorth() - b.getSouth()) * 111.32
  const dLng = (b.getEast() - b.getWest()) * 111.32 * Math.cos(latMid)
  return Math.abs(dLat * dLng)
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&zoom=10&lat=${lat}&lon=${lng}`,
      { headers: { Accept: "application/json" } },
    )
    const d = (await res.json()) as { name?: string; display_name?: string }
    if (d.name) return d.name
    if (d.display_name) return d.display_name.split(",").slice(0, 2).join(", ").trim()
  } catch {
    /* fall through */
  }
  return "Sentinel-2 ROI Region"
}

export function MapWorkspace() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const rectRef = useRef<Rectangle | null>(null)
  const overlayRef = useRef<ImageOverlay | null>(null)
  const satelliteRef = useRef<TileLayer | null>(null)
  const boundariesRef = useRef<TileLayer | null>(null)

  const [tool, setTool] = useState<ToolId>("explore")
  const toolRef = useRef<ToolId>("explore")
  const [zoom, setZoom] = useState(INITIAL_ZOOM)
  const [cursor, setCursor] = useState<{ lat: number; lng: number } | null>(null)
  const [region, setRegion] = useState<RegionInfo | null>(null)
  const [image, setImage] = useState<UploadedImage | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [layers, setLayers] = useState<LayersState>(DEFAULT_LAYERS)

  // AI Super-Resolution States
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [superResResult, setSuperResResult] = useState<SuperResResult | null>(null)
  const [temporalResult, setTemporalResult] = useState<TemporalResult | null>(null)

  useEffect(() => {
    toolRef.current = tool
  }, [tool])

  // Initialize Leaflet on the client.
  useEffect(() => {
    let disposed = false

      ; (async () => {
        const L = (await import("leaflet")).default ?? (await import("leaflet"))
        if (disposed || !containerRef.current || mapRef.current) return

        const map = L.map(containerRef.current, {
          center: INITIAL_CENTER,
          zoom: INITIAL_ZOOM,
          zoomControl: false,
          attributionControl: true,
          minZoom: 2,
          maxZoom: 19,
          worldCopyJump: true,
        })
        mapRef.current = map

        satelliteRef.current = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          { attribution: "Imagery &copy; Esri, Maxar, Copernicus Sentinel-2", maxZoom: 19 },
        ).addTo(map)

        boundariesRef.current = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 19, opacity: 0 },
        ).addTo(map)

        map.on("zoom", () => setZoom(map.getZoom()))
        map.on("mousemove", (e: import("leaflet").LeafletMouseEvent) =>
          setCursor({ lat: e.latlng.lat, lng: e.latlng.lng }),
        )
        map.on("mouseout", () => setCursor(null))

        // Region selection via drag-draw.
        let start: import("leaflet").LatLng | null = null
        let drawing = false

        map.on("mousedown", (e: import("leaflet").LeafletMouseEvent) => {
          if (toolRef.current !== "select") return
          drawing = true
          start = e.latlng
          if (rectRef.current) {
            rectRef.current.remove()
            rectRef.current = null
          }
          map.dragging.disable()
        })

        map.on("mousemove", (e: import("leaflet").LeafletMouseEvent) => {
          if (!drawing || !start) return
          const bounds = L.latLngBounds(start, e.latlng)
          if (rectRef.current) {
            rectRef.current.setBounds(bounds)
          } else {
            rectRef.current = L.rectangle(bounds, {
              color: "#4aa8ff",
              weight: 2,
              fillColor: "#4aa8ff",
              fillOpacity: 0.15,
              dashArray: "4, 4"
            }).addTo(map)
          }
        })

        const finishDraw = () => {
          if (!drawing) return
          drawing = false
          start = null
          map.dragging.enable()
          if (rectRef.current) commitSelection(rectRef.current.getBounds())
        }
        map.on("mouseup", finishDraw)

        setZoom(map.getZoom())
      })()

    return () => {
      disposed = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const commitSelection = (b: LatLngBounds) => {
    const area = estimateArea(b)
    const center = b.getCenter()
    const bounds = {
      min_lon: Math.min(b.getWest(), b.getEast()),
      min_lat: Math.min(b.getSouth(), b.getNorth()),
      max_lon: Math.max(b.getWest(), b.getEast()),
      max_lat: Math.max(b.getSouth(), b.getNorth()),
    }

    setRegion({
      name: "Locating Sentinel-2 ROI…",
      centerLat: center.lat,
      centerLng: center.lng,
      bounds,
      area,
      pixels: Math.round(area * 10_000),
      active: false,
    })
    reverseGeocode(center.lat, center.lng).then((name) =>
      setRegion((prev) => (prev ? { ...prev, name } : prev)),
    )
  }

  // Cursor reflects the active tool.
  useEffect(() => {
    const container = mapRef.current?.getContainer()
    if (!container) return
    container.style.cursor = tool === "select" ? "crosshair" : "grab"
  }, [tool])

  // Apply layer state to the map
  useEffect(() => {
    satelliteRef.current?.setOpacity(layers.satellite ? layers.opacity : 0)
    boundariesRef.current?.setOpacity(layers.boundaries ? 0.85 : 0)
    const container = mapRef.current?.getContainer()
    if (container) {
      const filters: string[] = []
      if (layers.falseColour) filters.push("hue-rotate(135deg) saturate(1.5)")
      if (layers.enhanced) filters.push("contrast(1.22) saturate(1.15) brightness(1.05)")
      container.style.filter = filters.join(" ")
    }
  }, [layers])

  const handleTool = useCallback((id: ToolId) => {
    setTool((prev) => (prev === id && id !== "explore" ? "explore" : id))
  }, [])

  const handleZoomIn = useCallback(() => mapRef.current?.zoomIn(), [])
  const handleZoomOut = useCallback(() => mapRef.current?.zoomOut(), [])
  const handleResetView = useCallback(() => mapRef.current?.setView(INITIAL_CENTER, INITIAL_ZOOM), [])

  const clearSelection = useCallback(() => {
    if (rectRef.current) {
      rectRef.current.remove()
      rectRef.current = null
    }
    if (overlayRef.current) {
      overlayRef.current.remove()
      overlayRef.current = null
    }
    setRegion(null)
  }, [])

  const useRegion = useCallback(() => {
    setRegion((prev) => (prev ? { ...prev, active: true } : prev))
    rectRef.current?.setStyle({ color: "#4aa8ff", weight: 2, fillOpacity: 0.1, dashArray: "" })
  }, [])

  const flyTo = useCallback((lat: number, lng: number, z = 14) => {
    mapRef.current?.flyTo([lat, lng], z, { duration: 1.1 })
  }, [])

  const loadImage = useCallback(() => {
    setImageLoaded(true)
    mapRef.current?.flyTo(BHUBANESWAR, 14, { duration: 1.2 })
  }, [])

  const toggleLayer = useCallback((id: LayerId) => {
    setLayers((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const setOpacity = useCallback((value: number) => {
    setLayers((prev) => ({ ...prev, opacity: value }))
  }, [])

  // Call FastAPI backend for 4x AI Super-Resolution
  const handleRunSuperRes = async (
    bounds: { min_lon: number; min_lat: number; max_lon: number; max_lat: number },
    dates: { date_from: string; date_to: string; sharpen_strength?: number; enable_ensemble?: boolean }
  ) => {
    setIsProcessing(true)
    setStatusMessage(dates.enable_ensemble ? "Connecting to Copernicus S2 API (8x TTSE Mode)..." : "Connecting to Copernicus S2 API...")

    const payload = {
      min_lon: bounds.min_lon,
      min_lat: bounds.min_lat,
      max_lon: bounds.max_lon,
      max_lat: bounds.max_lat,
      width: 256,
      height: 256,
      date_from: dates.date_from,
      date_to: dates.date_to,
      sharpen_strength: dates.sharpen_strength ?? 1.5,
      sharpen_radius: 1.0,
      sharpen_threshold: 2,
      enable_ensemble: dates.enable_ensemble ?? false,
    }

    let responseData = null
    let errorMsg = ""

    for (const baseUrl of BACKEND_URLS) {
      try {
        setStatusMessage(`Querying AI Model at ${baseUrl}...`)
        const res = await fetch(`${baseUrl}/api/upscale-bbox`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          responseData = await res.json()
          errorMsg = ""
          break
        } else {
          try {
            const errJson = await res.json()
            errorMsg = errJson.detail || res.statusText
          } catch {
            errorMsg = `Server error ${res.status}`
          }
        }
      } catch (err: any) {
        errorMsg = err?.message || "Connection failed"
      }
    }

    setIsProcessing(false)

    if (responseData && responseData.status === "success") {
      const formattedResult: SuperResResult = {
        status: responseData.status,
        bbox: responseData.bbox,
        originalDimensions: responseData.original_dimensions,
        upscaledDimensions: responseData.upscaled_dimensions,
        scaleFactor: responseData.scale_factor,
        confidenceScore: responseData.confidence_score,
        confidenceMap: responseData.confidence_map,
        originalImage: responseData.original_image,
        upscaledImage: responseData.upscaled_image,
        enableEnsemble: responseData.enable_ensemble,
        ndviAnalytics: responseData.ndvi_analytics,
        fidelityMetrics: responseData.fidelity_metrics,
        inferenceTimeMs: responseData.inference_time_ms,
      }
      setSuperResResult(formattedResult)
    } else {
      alert(`AI Super-Resolution Error: ${errorMsg || "Failed to process region."}`)
    }
  }

  const handleRunTemporalChange = async (
    bounds: { min_lon: number; min_lat: number; max_lon: number; max_lat: number },
    params: { date_from_a: string; date_to_a: string; date_from_b: string; date_to_b: string; mode: "urban" | "water" | "crop" }
  ) => {
    setIsProcessing(true)
    setStatusMessage("Running Dual 4x Super-Res & Change Detection...")

    const payload = {
      min_lon: bounds.min_lon,
      min_lat: bounds.min_lat,
      max_lon: bounds.max_lon,
      max_lat: bounds.max_lat,
      date_from_a: params.date_from_a,
      date_to_a: params.date_to_a,
      date_from_b: params.date_from_b,
      date_to_b: params.date_to_b,
      mode: params.mode
    }

    let responseData: any = null
    let errorMsg = ""

    for (const baseUrl of BACKEND_URLS) {
      try {
        setStatusMessage(`Querying Dual Temporal Model at ${baseUrl}...`)
        const res = await fetch(`${baseUrl}/api/compare-temporal-bbox`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          responseData = await res.json()
          errorMsg = ""
          break
        } else {
          try {
            const errJson = await res.json()
            errorMsg = errJson.detail || res.statusText
          } catch {
            errorMsg = `Server error ${res.status}`
          }
        }
      } catch (err: any) {
        errorMsg = err?.message || "Connection failed"
      }
    }

    setIsProcessing(false)

    if (responseData && responseData.status === "success") {
      setTemporalResult({
        status: responseData.status,
        bbox: responseData.bbox,
        mode: responseData.mode,
        dateA: responseData.date_a,
        dateB: responseData.date_b,
        dimensions: responseData.dimensions,
        imageA: responseData.image_a,
        imageB: responseData.image_b,
        diffMap: responseData.diff_map,
        changePct: responseData.change_pct,
        estStructures: responseData.est_structures,
        inferenceTimeMs: responseData.inference_time_ms,
      })
    } else {
      alert(`Multi-Temporal Analysis Error: ${errorMsg || "Failed to process region."}`)
    }
  }



  // Overlay super-resolved high-res PNG onto Leaflet map
  const handleOverlayOnMap = async (result: SuperResResult) => {
    const L = (await import("leaflet")).default ?? (await import("leaflet"))
    if (!mapRef.current) return

    const bounds: [[number, number], [number, number]] = [
      [result.bbox[1], result.bbox[0]], // [south, west]
      [result.bbox[3], result.bbox[2]], // [north, east]
    ]

    if (overlayRef.current) {
      overlayRef.current.remove()
    }

    overlayRef.current = L.imageOverlay(result.upscaledImage, bounds, {
      opacity: 0.95,
      interactive: true,
    }).addTo(mapRef.current)

    mapRef.current.fitBounds(bounds, { padding: [20, 20], animate: true })
    setSuperResResult(null)
  }

  const handleOverlayTemporalOnMap = async (result: TemporalResult) => {
    const L = (await import("leaflet")).default ?? (await import("leaflet"))
    if (!mapRef.current) return

    const bounds: [[number, number], [number, number]] = [
      [result.bbox[1], result.bbox[0]],
      [result.bbox[3], result.bbox[2]],
    ]

    if (overlayRef.current) {
      overlayRef.current.remove()
    }

    overlayRef.current = L.imageOverlay(result.diffMap, bounds, {
      opacity: 0.95,
      interactive: true,
    }).addTo(mapRef.current)

    mapRef.current.fitBounds(bounds, { padding: [20, 20], animate: true })
    setTemporalResult(null)
  }



  return (
    <main className="relative h-svh w-full overflow-hidden bg-background">
      {/* Map is the hero */}
      <div ref={containerRef} className="absolute inset-0 z-0" aria-label="Satellite map" />

      {/* Brand */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3">
        <div className="pointer-events-auto flex items-center gap-2 border border-border bg-popover/90 px-3 py-2 backdrop-blur-sm shadow-md">
          <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
          <span className="font-mono text-xs font-semibold tracking-[0.2em] text-foreground">
            EARTHINTEL S2-SUPERRES
          </span>
        </div>
        {imageLoaded && (
          <div className="pointer-events-auto flex items-center gap-2 border border-primary/40 bg-popover/90 px-3 py-2 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse bg-primary" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
              {image?.name ?? "Image loaded"}
            </span>
          </div>
        )}
      </header>

      {/* Left toolbar + contextual panel */}
      <div className="absolute left-3 top-16 z-20 flex items-start gap-2">
        <Toolbar active={tool} onSelect={handleTool} />
        {tool === "search" && <SearchPanel onClose={() => setTool("explore")} onLocate={flyTo} />}
        {tool === "upload" && (
          <UploadPanel
            onClose={() => setTool("explore")}
            image={image}
            onFile={setImage}
            onLoad={loadImage}
          />
        )}
        {tool === "select" && (
          <RegionPanel
            onClose={() => setTool("explore")}
            region={region}
            onUse={useRegion}
            onClear={clearSelection}
            onRunSuperRes={handleRunSuperRes}
            onRunTemporalChange={handleRunTemporalChange}
            isProcessing={isProcessing}
            statusMessage={statusMessage}
          />
        )}
        {tool === "layers" && (
          <LayersPanel
            onClose={() => setTool("explore")}
            layers={layers}
            onToggle={toggleLayer}
            onOpacity={setOpacity}
          />
        )}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-16 right-3 z-20">
        <ZoomControls
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleResetView}
        />
      </div>

      {/* Bottom status strip */}
      <StatusBar cursor={cursor} zoom={zoom} tool={tool} imageLoaded={imageLoaded} />

      {/* Super Resolution Results Comparison Modal */}
      {superResResult && (
        <SuperResModal
          result={superResResult}
          onClose={() => setSuperResResult(null)}
          onOverlayOnMap={handleOverlayOnMap}
        />
      )}

      {/* Multi-Temporal Change Detection Modal */}
      {temporalResult && (
        <TemporalChangeModal
          result={temporalResult}
          onClose={() => setTemporalResult(null)}
          onOverlayOnMap={handleOverlayTemporalOnMap}
        />
      )}
    </main>
  )
}
