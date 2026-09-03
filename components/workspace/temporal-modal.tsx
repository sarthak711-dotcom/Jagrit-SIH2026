"use client"

import { useState, useRef, useCallback } from "react"
import {
    X,
    Sliders,
    Columns,
    Sparkles,
    Zap,
    Building2,
    Droplets,
    Sprout,
    Activity,
    Layers,
    ArrowRight
} from "lucide-react"

export type TemporalResult = {
    status: string
    bbox: [number, number, number, number]
    mode: "urban" | "water" | "crop"
    dateA: string
    dateB: string
    dimensions: [number, number]
    imageA: string
    imageB: string
    diffMap: string
    changePct: number
    estStructures: number
    inferenceTimeMs: number
}

interface TemporalChangeModalProps {
    result: TemporalResult
    onClose: () => void
    onOverlayOnMap: (result: TemporalResult) => void
}

export function TemporalChangeModal({ result, onClose, onOverlayOnMap }: TemporalChangeModalProps) {
    const [sliderPosition, setSliderPosition] = useState(50)
    const [isDragging, setIsDragging] = useState(false)
    const [viewMode, setViewMode] = useState<"slider" | "sideBySide" | "diff">("slider")

    const containerRef = useRef<HTMLDivElement>(null)

    const handleMove = useCallback((clientX: number) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = clientX - rect.left
        const pos = Math.max(0, Math.min(100, (x / rect.width) * 100))
        setSliderPosition(pos)
    }, [])

    const handleMouseDown = () => setIsDragging(true)
    const handleMouseUp = () => setIsDragging(false)
    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) handleMove(e.clientX)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length > 0) handleMove(e.touches[0].clientX)
    }

    const getModeTitle = () => {
        switch (result.mode) {
            case "urban":
                return { title: "Urban Encroachment & Illegal Structure Detection", icon: Building2, color: "text-rose-400" }
            case "water":
                return { title: "Water Body Shoreline & Reservoir Shrinkage", icon: Droplets, color: "text-cyan-400" }
            case "crop":
                return { title: "Crop Canopy & Agriculture Field Boundary Change", icon: Sprout, color: "text-emerald-400" }
            default:
                return { title: "Multi-Temporal Super-Res Change Analysis", icon: Activity, color: "text-primary" }
        }
    }

    const modeInfo = getModeTitle()
    const ModeIcon = modeInfo.icon

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-primary/40 bg-background/95 shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 border border-primary/40 ${modeInfo.color}`}>
                            <ModeIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-mono text-base font-bold text-foreground tracking-wide">
                                    {modeInfo.title}
                                </h2>
                                <span className="rounded bg-primary/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary uppercase border border-primary/30">
                                    4x Dual Super-Res Active
                                </span>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground mt-0.5">
                                <span>Period A: <strong className="text-foreground">{result.dateA}</strong></span>
                                <ArrowRight className="h-3 w-3 text-primary" />
                                <span>Period B: <strong className="text-foreground">{result.dateB}</strong></span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex rounded-md bg-muted/60 p-1 border border-border">
                            <button
                                onClick={() => setViewMode("slider")}
                                className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs transition-colors ${viewMode === "slider"
                                        ? "bg-primary text-primary-foreground font-semibold shadow"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <Sliders className="h-3.5 w-3.5" />
                                Split Timeline
                            </button>
                            <button
                                onClick={() => setViewMode("sideBySide")}
                                className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs transition-colors ${viewMode === "sideBySide"
                                        ? "bg-primary text-primary-foreground font-semibold shadow"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <Columns className="h-3.5 w-3.5" />
                                Dual Date View
                            </button>
                            <button
                                onClick={() => setViewMode("diff")}
                                className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs transition-colors ${viewMode === "diff"
                                        ? "bg-rose-600 text-white font-semibold shadow"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <Activity className="h-3.5 w-3.5" />
                                Encroachment Diff Map
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Main View Canvas */}
                <div className="relative flex-1 overflow-hidden bg-black/60 p-4 flex items-center justify-center select-none">
                    {viewMode === "slider" ? (
                        <div
                            ref={containerRef}
                            onMouseDown={handleMouseDown}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onMouseMove={handleMouseMove}
                            onTouchMove={handleTouchMove}
                            className="relative h-full w-full max-w-4xl overflow-hidden rounded-lg border border-border/60 cursor-ew-resize"
                        >
                            {/* Period B (Right) */}
                            <img
                                src={result.imageB}
                                alt={`Period B (${result.dateB})`}
                                className="absolute inset-0 h-full w-full object-contain pointer-events-none"
                            />
                            <div className="absolute top-3 right-3 z-10 rounded bg-black/75 px-2.5 py-1 font-mono text-xs font-semibold text-primary border border-primary/40 backdrop-blur-sm">
                                4x Super-Res: Period B ({result.dateB})
                            </div>

                            {/* Period A (Left, Clipped) */}
                            <div
                                className="absolute inset-0 overflow-hidden"
                                style={{ width: `${sliderPosition}%` }}
                            >
                                <img
                                    src={result.imageA}
                                    alt={`Period A (${result.dateA})`}
                                    className="absolute inset-0 h-full w-full object-contain max-w-none pointer-events-none"
                                    style={{
                                        width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%",
                                        height: containerRef.current ? `${containerRef.current.clientHeight}px` : "100%",
                                    }}
                                />
                                <div className="absolute top-3 left-3 z-10 rounded bg-black/75 px-2.5 py-1 font-mono text-xs font-semibold text-foreground border border-border backdrop-blur-sm">
                                    4x Super-Res: Period A ({result.dateA})
                                </div>
                            </div>

                            {/* Slider Line */}
                            <div
                                className="absolute top-0 bottom-0 z-20 w-1 bg-primary cursor-ew-resize shadow-[0_0_10px_rgba(74,168,255,0.8)]"
                                style={{ left: `${sliderPosition}%` }}
                            >
                                <div className="absolute top-1/2 -left-3.5 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg border-2 border-background">
                                    <Sliders className="h-4 w-4 rotate-90" />
                                </div>
                            </div>
                        </div>
                    ) : viewMode === "sideBySide" ? (
                        <div className="grid h-full w-full max-w-4xl grid-cols-2 gap-4">
                            <div className="relative flex flex-col overflow-hidden rounded-lg border border-border bg-black/40">
                                <div className="absolute top-3 left-3 z-10 rounded bg-black/70 px-2.5 py-1 font-mono text-xs font-semibold text-muted-foreground border border-border backdrop-blur-sm">
                                    Period A ({result.dateA}) [2.5m GSD]
                                </div>
                                <img src={result.imageA} alt="Period A" className="h-full w-full object-contain" />
                            </div>
                            <div className="relative flex flex-col overflow-hidden rounded-lg border border-primary/40 bg-black/40">
                                <div className="absolute top-3 left-3 z-10 rounded bg-primary/20 px-2.5 py-1 font-mono text-xs font-semibold text-primary border border-primary/40 backdrop-blur-sm">
                                    Period B ({result.dateB}) [2.5m GSD]
                                </div>
                                <img src={result.imageB} alt="Period B" className="h-full w-full object-contain" />
                            </div>
                        </div>
                    ) : (
                        /* Encroachment & Temporal Change Heatmap */
                        <div className="relative flex h-full w-full max-w-4xl flex-col items-center justify-center overflow-hidden rounded-lg border border-rose-500/40 bg-black/50">
                            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded bg-black/85 px-3 py-1.5 font-mono text-xs font-bold text-rose-400 border border-rose-500/40 backdrop-blur-sm">
                                <Activity className="h-4 w-4" />
                                Pixel Change & Structure Encroachment Map ({result.changePct}% Area Shift)
                            </div>

                            <img src={result.diffMap} alt="Encroachment Heatmap" className="h-full w-full object-contain" />

                            <div className="absolute bottom-3 inset-x-6 z-10 flex items-center justify-between rounded bg-black/85 px-4 py-2 font-mono text-[11px] border border-border backdrop-blur-sm">
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-rose-500 border border-rose-400" />
                                    <span className="text-rose-400 font-semibold">New Encroachment / Structure Added</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-amber-400 border border-amber-300" />
                                    <span className="text-amber-300 font-semibold">Boundary / Canopy Shift</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-muted-foreground/40" />
                                    <span className="text-muted-foreground">Unchanged Ground Surface</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Analytical Summary */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/80 px-6 py-4 bg-muted/20">
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground">
                        <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded border border-border">
                            <Zap className="h-3.5 w-3.5 text-yellow-400" />
                            <span>Inference: <strong className="text-foreground">{result.inferenceTimeMs} ms</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded border border-border">
                            <Building2 className="h-3.5 w-3.5 text-rose-400" />
                            <span>Est. New Anomalies: <strong className="text-rose-400">{result.estStructures} structures</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded border border-border">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            <span>Ground Shift: <strong className="text-primary">{result.changePct}% area changed</strong></span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onOverlayOnMap(result)}
                            className="flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/20 px-4 py-2 font-mono text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground shadow-md"
                        >
                            <Layers className="h-4 w-4" />
                            Overlay Diff Map
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}
