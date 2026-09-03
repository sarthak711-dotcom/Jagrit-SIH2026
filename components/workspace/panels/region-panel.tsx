"use client"

import { useState } from "react"
import { SquareDashed, Sparkles, Loader2, Calendar, ShieldCheck, AlertTriangle, Building2, Droplets, Sprout, Activity } from "lucide-react"
import { PanelShell, MetaRow } from "@/components/workspace/panel-shell"

export type RegionInfo = {
  name: string
  centerLat: number
  centerLng: number
  bounds?: {
    min_lon: number
    min_lat: number
    max_lon: number
    max_lat: number
  }
  area: number // km²
  pixels: number
  active: boolean
}

export function RegionPanel({
  onClose,
  region,
  onUse,
  onClear,
  onRunSuperRes,
  onRunTemporalChange,
  onRunModelCompare,
  isProcessing = false,
  statusMessage = "",
}: {
  onClose: () => void
  region: RegionInfo | null
  onUse: () => void
  onClear: () => void
  onRunSuperRes?: (bounds: { min_lon: number; min_lat: number; max_lon: number; max_lat: number }, dates: { date_from: string; date_to: string; sharpen_strength?: number }) => void
  onRunTemporalChange?: (
    bounds: { min_lon: number; min_lat: number; max_lon: number; max_lat: number },
    params: { date_from_a: string; date_to_a: string; date_from_b: string; date_to_b: string; mode: "urban" | "water" | "crop" }
  ) => void
  onRunModelCompare?: (bounds: { min_lon: number; min_lat: number; max_lon: number; max_lat: number }, dates: { date_from: string; date_to: string }) => void
  isProcessing?: boolean
  statusMessage?: string
}) {
  const [pipelineMode, setPipelineMode] = useState<"single" | "temporal" | "compare">("single")
  const [analysisPreset, setAnalysisPreset] = useState<"urban" | "water" | "crop">("urban")

  // Single date range
  const [dateFrom, setDateFrom] = useState("2024-05-01")
  const [dateTo, setDateTo] = useState("2024-05-15")

  // Post-processing Unsharp Mask Sharpening
  const [sharpenStrength, setSharpenStrength] = useState(1.5)

  // Temporal dual date ranges
  const [dateFromA, setDateFromA] = useState("2020-05-01")
  const [dateToA, setDateToA] = useState("2020-05-30")
  const [dateFromB, setDateFromB] = useState("2024-05-01")
  const [dateToB, setDateToB] = useState("2024-05-30")

  if (!region) {
    return (
      <PanelShell title="Select Region of Interest" onClose={onClose}>
        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/30 text-primary">
            <SquareDashed className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <div>
            <h4 className="font-mono text-xs font-semibold text-foreground uppercase tracking-wider">
              Draw Region Box
            </h4>
            <p className="mt-1 font-mono text-xs text-muted-foreground max-w-[200px]">
              Drag a bounding box on the map to capture a 10m Copernicus Sentinel-2 section for AI Super-Resolution & Change Detection.
            </p>
          </div>
        </div>
      </PanelShell>
    )
  }

  const isSmallROI = region.area < 1.0
  const isLargeROI = region.area > 26.0

  const handleRunAI = () => {
    if (!region.bounds) return
    if (pipelineMode === "single" && onRunSuperRes) {
      onRunSuperRes(region.bounds, {
        date_from: `${dateFrom}T00:00:00Z`,
        date_to: `${dateTo}T23:59:59Z`,
        sharpen_strength: sharpenStrength,
      })
    } else if (pipelineMode === "temporal" && onRunTemporalChange) {
      onRunTemporalChange(region.bounds, {
        date_from_a: `${dateFromA}T00:00:00Z`,
        date_to_a: `${dateToA}T23:59:59Z`,
        date_from_b: `${dateFromB}T00:00:00Z`,
        date_to_b: `${dateToB}T23:59:59Z`,
        mode: analysisPreset,
      })
    } else if (pipelineMode === "compare" && onRunModelCompare) {
      onRunModelCompare(region.bounds, {
        date_from: `${dateFrom}T00:00:00Z`,
        date_to: `${dateTo}T23:59:59Z`,
      })
    }
  }

  return (
    <PanelShell title="Selected Region & AI Pipeline" onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5 bg-muted/20">
        <div className="flex items-center gap-2 truncate">
          <span
            className={[
              "h-2 w-2 shrink-0 rounded-full",
              region.active ? "bg-primary shadow-[0_0_8px_rgba(74,168,255,0.8)]" : "bg-muted-foreground/50",
            ].join(" ")}
          />
          <span className="truncate font-mono text-xs font-semibold text-foreground">{region.name}</span>
        </div>
        <span className="font-mono text-[10px] text-primary uppercase font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
          10m S2 ROI
        </span>
      </div>

      <div className="divide-y divide-border/60 py-0.5">
        <MetaRow
          label="Selected Area"
          value={
            region.area >= 1000
              ? `${(region.area / 1000).toFixed(1)}k km²`
              : `${region.area.toFixed(2)} km²`
          }
        />
        <MetaRow label="Sensor Pixels" value={`${region.pixels.toLocaleString("en-US")} px (10m)`} />
      </div>

      {/* Estimated AI Input & Super-Res Output Pixel Resolution Preview Box */}
      {(() => {
        let inW = 128
        let inH = 128
        let isAdjusted = false
        if (region.bounds) {
          const { min_lon, min_lat, max_lon, max_lat } = region.bounds
          const latCenter = (min_lat + max_lat) / 2.0
          const cosLat = Math.max(0.1, Math.cos((latCenter * Math.PI) / 180.0))
          let dLatM = Math.abs(max_lat - min_lat) * 111320.0
          let dLonM = Math.abs(max_lon - min_lon) * 111320.0 * cosLat

          if (dLatM < 1280.0 || dLonM < 1280.0) {
            dLatM = Math.max(dLatM, 1280.0)
            dLonM = Math.max(dLonM, 1280.0)
            isAdjusted = true
          }
          if (dLatM > 5120.0 || dLonM > 5120.0) {
            dLatM = Math.min(dLatM, 5120.0)
            dLonM = Math.min(dLonM, 5120.0)
            isAdjusted = true
          }
          inW = Math.min(256, Math.max(128, Math.round(dLonM / 10.0)))
          inH = Math.min(256, Math.max(128, Math.round(dLatM / 10.0)))
        }
        const outW = inW * 4
        const outH = inH * 4

        return (
          <div className="mx-3 my-2 rounded-lg border border-primary/40 bg-primary/10 p-2.5 space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground font-semibold">AI Input Image:</span>
              <span className="font-bold text-foreground bg-background/80 px-2 py-0.5 rounded border border-border">
                {inW} &times; {inH} px (10m)
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-primary font-bold">4x Super-Res Output:</span>
              <span className="font-bold text-primary bg-primary/20 px-2 py-0.5 rounded border border-primary/40">
                {outW} &times; {outH} px (2.5m)
              </span>
            </div>
            {isAdjusted && (
              <p className="text-[9px] text-amber-400 italic pt-1 border-t border-primary/20">
                &bull; Bounding box grid adjusted to fit 1.28km-5.12km sensor window
              </p>
            )}
          </div>
        )
      })()}

      {isSmallROI && (
        <div className="mx-3 my-2 flex items-start gap-2 rounded bg-primary/10 p-2 border border-primary/30 text-primary font-mono text-[10px]">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            <strong>10m Grid Protection:</strong> Small ROI auto-expands to 1.28 km 10m sensor grid.
          </span>
        </div>
      )}

      {isLargeROI && (
        <div className="mx-3 my-2 flex items-start gap-2 rounded bg-amber-500/10 p-2 border border-amber-500/30 text-amber-400 font-mono text-[10px]">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            <strong>Upper Limit Protection:</strong> Large ROI auto-clamps to max 5.12 km × 5.12 km (~26 km²).
          </span>
        </div>
      )}

      {/* Mode Switcher Tab */}
      <div className="p-3 border-t border-border/80 bg-muted/10 space-y-2">
        <label className="block font-mono text-[10px] uppercase font-semibold text-muted-foreground">
          Analysis Pipeline Mode:
        </label>
        <div className="grid grid-cols-3 gap-1 rounded bg-muted/60 p-1 border border-border">
          <button
            type="button"
            onClick={() => setPipelineMode("single")}
            className={`py-1 px-1.5 font-mono text-[10px] rounded transition-colors ${pipelineMode === "single"
              ? "bg-primary text-primary-foreground font-bold shadow"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Super-Res
          </button>
          <button
            type="button"
            onClick={() => setPipelineMode("temporal")}
            className={`py-1 px-1.5 font-mono text-[10px] rounded transition-colors ${pipelineMode === "temporal"
              ? "bg-rose-600 text-white font-bold shadow"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Temporal
          </button>
          <button
            type="button"
            onClick={() => setPipelineMode("compare")}
            className={`py-1 px-1.5 font-mono text-[10px] rounded transition-colors ${pipelineMode === "compare"
              ? "bg-amber-600 text-white font-bold shadow"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Model Compare
          </button>
        </div>
      </div>

      {/* Pipeline Config Controls */}
      {pipelineMode === "single" ? (
        <div className="border-t border-border/80 p-3 bg-muted/10 space-y-3">
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>Acquisition Date Range:</span>
          </div>

          {/* Cloud-Free Year & Season Preset Selector */}
          <div className="space-y-1">
            <label className="block font-mono text-[9px] text-muted-foreground uppercase font-semibold">
              Sentinel-2 Year & Season Preset:
            </label>
            <select
              onChange={(e) => {
                const val = e.target.value
                if (!val) return
                const [f, t] = val.split("|")
                if (f && t) {
                  setDateFrom(f)
                  setDateTo(t)
                }
              }}
              className="w-full rounded border border-primary/40 bg-background px-2 py-1.5 font-mono text-[11px] text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">-- Select Year / Season Preset --</option>
              <option value="2024-05-01|2024-05-15">2024 Summer (May 01 - May 15) [Best Quality]</option>
              <option value="2024-01-15|2024-02-15">2024 Winter (Jan 15 - Feb 15)</option>
              <option value="2023-05-01|2023-05-30">2023 Summer (May 01 - May 30)</option>
              <option value="2023-12-01|2023-12-20">2023 Winter (Dec 01 - Dec 20)</option>
              <option value="2022-06-01|2022-06-30">2022 Summer (Jun 01 - Jun 30)</option>
              <option value="2021-07-01|2021-07-30">2021 Summer (Jul 01 - Jul 30)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-mono text-[9px] text-muted-foreground uppercase">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded border border-border bg-background px-2 py-1 font-mono text-[11px] text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-mono text-[9px] text-muted-foreground uppercase">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded border border-border bg-background px-2 py-1 font-mono text-[11px] text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Sharpening Strength Slider Control */}
          <div className="pt-2 border-t border-border/60 space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="font-semibold text-foreground">Sharpening Strength:</span>
              <span className="rounded bg-primary/20 px-1.5 py-0.5 font-bold text-primary border border-primary/30">
                {sharpenStrength.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="3.0"
              step="0.1"
              value={sharpenStrength}
              onChange={(e) => setSharpenStrength(parseFloat(e.target.value))}
              className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex items-center justify-between font-mono text-[9px] text-muted-foreground">
              <span>0.0 (Off)</span>
              <span>1.5 (Default)</span>
              <span>3.0 (Max)</span>
            </div>
            <p className="font-mono text-[9px] text-muted-foreground italic">
              Unsharp Mask (Radius 1.0, Thresh 2) &bull; Prevents halos & ringing
            </p>
          </div>
        </div>
      ) : (
        <div className="border-t border-border/80 p-3 bg-muted/10 space-y-3">
          {/* Preset Selector */}
          <div className="space-y-1">
            <label className="block font-mono text-[10px] text-muted-foreground uppercase font-semibold">
              Use-Case Application Preset:
            </label>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setAnalysisPreset("urban")}
                className={`flex flex-col items-center gap-1 p-1.5 rounded border text-[10px] font-mono transition-all ${analysisPreset === "urban"
                  ? "bg-rose-500/20 text-rose-400 border-rose-500/50 font-bold"
                  : "border-border text-muted-foreground hover:bg-muted"
                  }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Urban</span>
              </button>
              <button
                type="button"
                onClick={() => setAnalysisPreset("water")}
                className={`flex flex-col items-center gap-1 p-1.5 rounded border text-[10px] font-mono transition-all ${analysisPreset === "water"
                  ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 font-bold"
                  : "border-border text-muted-foreground hover:bg-muted"
                  }`}
              >
                <Droplets className="h-3.5 w-3.5" />
                <span>Water</span>
              </button>
              <button
                type="button"
                onClick={() => setAnalysisPreset("crop")}
                className={`flex flex-col items-center gap-1 p-1.5 rounded border text-[10px] font-mono transition-all ${analysisPreset === "crop"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 font-bold"
                  : "border-border text-muted-foreground hover:bg-muted"
                  }`}
              >
                <Sprout className="h-3.5 w-3.5" />
                <span>Crop</span>
              </button>
            </div>
          </div>

          {/* Temporal Multi-Year Date Preset Selector */}
          <div className="space-y-1 pt-1 border-t border-border/60">
            <label className="block font-mono text-[9px] text-muted-foreground uppercase font-semibold">
              Temporal Benchmark Date Presets:
            </label>
            <select
              onChange={(e) => {
                const val = e.target.value
                if (!val) return
                const [fa, ta, fb, tb] = val.split("|")
                if (fa && ta && fb && tb) {
                  setDateFromA(fa)
                  setDateToA(ta)
                  setDateFromB(fb)
                  setDateToB(tb)
                }
              }}
              className="w-full rounded border border-rose-500/40 bg-background px-2 py-1.5 font-mono text-[11px] text-foreground focus:border-rose-500 focus:outline-none"
            >
              <option value="">-- Select Temporal Comparison Preset --</option>
              <option value="2020-05-01|2020-05-30|2024-05-01|2024-05-30">4-Year Comparison (May 2020 vs May 2024) [Recommended]</option>
              <option value="2021-06-01|2021-06-30|2024-06-01|2024-06-30">3-Year Comparison (Jun 2021 vs Jun 2024)</option>
              <option value="2022-05-01|2022-05-30|2024-05-01|2024-05-30">2-Year Comparison (May 2022 vs May 2024)</option>
              <option value="2023-01-01|2023-01-30|2024-01-01|2024-01-30">1-Year Winter Growth (Jan 2023 vs Jan 2024)</option>
            </select>
          </div>

          {/* Dual Date Input A & B */}
          <div className="space-y-2 pt-1 border-t border-border/60">
            <div className="font-mono text-[10px] font-bold text-foreground">
              Period A (Earlier Date):
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateFromA}
                onChange={(e) => setDateFromA(e.target.value)}
                className="w-full rounded border border-border bg-background px-2 py-1 font-mono text-[10px] text-foreground focus:border-primary focus:outline-none"
              />
              <input
                type="date"
                value={dateToA}
                onChange={(e) => setDateToA(e.target.value)}
                className="w-full rounded border border-border bg-background px-2 py-1 font-mono text-[10px] text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-border/60">
            <div className="font-mono text-[10px] font-bold text-foreground">
              Period B (Recent Date):
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateFromB}
                onChange={(e) => setDateFromB(e.target.value)}
                className="w-full rounded border border-border bg-background px-2 py-1 font-mono text-[10px] text-foreground focus:border-primary focus:outline-none"
              />
              <input
                type="date"
                value={dateToB}
                onChange={(e) => setDateToB(e.target.value)}
                className="w-full rounded border border-border bg-background px-2 py-1 font-mono text-[10px] text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 border-t border-border p-3">
        <button
          type="button"
          onClick={handleRunAI}
          disabled={isProcessing || !region.bounds}
          className={`relative group w-full flex items-center justify-center gap-2 py-2.5 px-3 font-mono text-xs font-bold uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-50 rounded shadow-lg ${pipelineMode === "temporal"
            ? "bg-rose-600 text-white shadow-rose-600/20 hover:opacity-95"
            : "bg-primary text-primary-foreground shadow-primary/20 hover:opacity-95"
            }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing Dual Super-Res...</span>
            </>
          ) : pipelineMode === "temporal" ? (
            <>
              <Activity className="h-4 w-4 text-white group-hover:animate-pulse" />
              <span>Run Temporal Change Detection</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-primary-foreground group-hover:animate-bounce" />
              <span>Run 4x AI Super-Resolution</span>
            </>
          )}
        </button>

        {isProcessing && statusMessage && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-primary/10 border border-primary/30 text-primary font-mono text-[10px]">
            <Loader2 className="h-3 w-3 animate-spin shrink-0" />
            <span className="truncate">{statusMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            type="button"
            onClick={onUse}
            disabled={region.active}
            className="w-full border border-border py-1.5 font-mono text-[10px] uppercase tracking-wider text-foreground transition-colors hover:bg-muted disabled:opacity-50 rounded"
          >
            {region.active ? "Region Active" : "Lock Region"}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="w-full border border-border py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive rounded"
          >
            Clear ROI
          </button>
        </div>
      </div>
    </PanelShell>
  )
}
