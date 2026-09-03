"use client"

import { useState, useRef, useCallback } from "react"
import {
    X,
    Sliders,
    Columns,
    Cpu,
    Layers,
    Activity,
    Zap,
    CheckCircle2
} from "lucide-react"

export type ModelCompareResult = {
    status: string
    bbox: [number, number, number, number]
    modelAName: string
    modelBName: string
    dimensions: [number, number]
    imageA: string
    confidenceScoreA: number
    imageB: string
    confidenceScoreB: number
    diffMap: string
    discrepancyPct: number
    inferenceTimeMs: number
}

interface ModelCompareModalProps {
    result: ModelCompareResult
    onClose: () => void
    onOverlayOnMap: (imageUri: string, bbox: [number, number, number, number]) => void
}

export function ModelCompareModal({ result, onClose, onOverlayOnMap }: ModelCompareModalProps) {
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-primary/40 bg-background/95 shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 border border-primary/40 text-primary">
                            <Cpu className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-mono text-base font-bold text-foreground tracking-wide">
                                    AI Model Comparison Benchmark
                                </h2>
                                <span className="rounded bg-primary/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary uppercase border border-primary/30">
                                    {result.modelAName} vs {result.modelBName}
                                </span>
                            </div>
                            <p className="font-mono text-xs text-muted-foreground mt-0.5">
                                Side-by-side 4x Super-Resolution outputs & model delta evaluation on exact same S2 patch
                            </p>
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
                                Comparison Slider
                            </button>
                            <button
                                onClick={() => setViewMode("sideBySide")}
                                className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs transition-colors ${viewMode === "sideBySide"
                                        ? "bg-primary text-primary-foreground font-semibold shadow"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <Columns className="h-3.5 w-3.5" />
                                Side-by-Side View
                            </button>
                            <button
                                onClick={() => setViewMode("diff")}
                                className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs transition-colors ${viewMode === "diff"
                                        ? "bg-amber-600 text-white font-semibold shadow"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <Activity className="h-3.5 w-3.5" />
                                Model Delta Heatmap
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
                            {/* Model B Output (Right) */}
                            <img
                                src={result.imageB}
                                alt={`Model B (${result.modelBName})`}
                                className="absolute inset-0 h-full w-full object-contain pointer-events-none"
                            />
                            <div className="absolute top-3 right-3 z-10 flex items-center gap-2 rounded bg-black/80 px-3 py-1.5 font-mono text-xs font-semibold text-emerald-400 border border-emerald-500/40 backdrop-blur-sm shadow-md">
                                <span>Model B ({result.modelBName})</span>
                                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300 border border-emerald-500/30">
                                    {result.confidenceScoreB}% Conf.
                                </span>
                            </div>

                            {/* Model A Output (Left, Clipped) */}
                            <div
                                className="absolute inset-0 overflow-hidden"
                                style={{ width: `${sliderPosition}%` }}
                            >
                                <img
                                    src={result.imageA}
                                    alt={`Model A (${result.modelAName})`}
                                    className="absolute inset-0 h-full w-full object-contain max-w-none pointer-events-none"
                                    style={{
                                        width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%",
                                        height: containerRef.current ? `${containerRef.current.clientHeight}px` : "100%",
                                    }}
                                />
                                <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded bg-black/80 px-3 py-1.5 font-mono text-xs font-semibold text-sky-400 border border-sky-500/40 backdrop-blur-sm shadow-md">
                                    <span>Model A ({result.modelAName})</span>
                                    <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] text-sky-300 border border-sky-500/30">
                                        {result.confidenceScoreA}% Conf.
                                    </span>
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
                            {/* Panel A */}
                            <div className="relative flex flex-col overflow-hidden rounded-lg border border-sky-500/40 bg-black/40">
                                <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded bg-black/80 px-2.5 py-1 font-mono text-xs font-semibold text-sky-400 border border-sky-500/40 backdrop-blur-sm">
                                    <span>Model A ({result.modelAName})</span>
                                    <span className="text-[10px] text-sky-300">[{result.confidenceScoreA}% Conf.]</span>
                                </div>
                                <img src={result.imageA} alt="Model A" className="h-full w-full object-contain" />
                            </div>

                            {/* Panel B */}
                            <div className="relative flex flex-col overflow-hidden rounded-lg border border-emerald-500/40 bg-black/40">
                                <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded bg-black/80 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-400 border border-emerald-500/40 backdrop-blur-sm">
                                    <span>Model B ({result.modelBName})</span>
                                    <span className="text-[10px] text-emerald-300">[{result.confidenceScoreB}% Conf.]</span>
                                </div>
                                <img src={result.imageB} alt="Model B" className="h-full w-full object-contain" />
                            </div>
                        </div>
                    ) : (
                        /* Model Discrepancy Heatmap */
                        <div className="relative flex h-full w-full max-w-4xl flex-col items-center justify-center overflow-hidden rounded-lg border border-amber-500/40 bg-black/50">
                            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded bg-black/85 px-3 py-1.5 font-mono text-xs font-bold text-amber-400 border border-amber-500/40 backdrop-blur-sm">
                                <Activity className="h-4 w-4" />
                                Model Output Delta Heatmap ({result.discrepancyPct}% Discrepancy Shift)
                            </div>

                            <img src={result.diffMap} alt="Model Discrepancy Heatmap" className="h-full w-full object-contain" />

                            <div className="absolute bottom-3 inset-x-6 z-10 flex items-center justify-between rounded bg-black/85 px-4 py-2 font-mono text-[11px] border border-border backdrop-blur-sm">
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-red-500 border border-red-400" />
                                    <span className="text-red-400 font-semibold">High Discrepancy / Feature Variance</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-cyan-400 border border-cyan-300" />
                                    <span className="text-cyan-300 font-semibold">Moderate Structural Difference</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-muted-foreground/40" />
                                    <span className="text-muted-foreground">Identical Predictions</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Metrics */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/80 px-6 py-4 bg-muted/20">
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground">
                        <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded border border-border">
                            <Zap className="h-3.5 w-3.5 text-yellow-400" />
                            <span>Inference: <strong className="text-foreground">{result.inferenceTimeMs} ms</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded border border-border">
                            <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
                            <span>Model A ({result.modelAName}): <strong className="text-sky-400">{result.confidenceScoreA}%</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded border border-border">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Model B ({result.modelBName}): <strong className="text-emerald-400">{result.confidenceScoreB}%</strong></span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onOverlayOnMap(result.imageA, result.bbox)}
                            className="flex items-center gap-1.5 rounded-lg border border-sky-500/50 bg-sky-500/20 px-3 py-1.5 font-mono text-xs font-semibold text-sky-300 transition-all hover:bg-sky-500 hover:text-white"
                        >
                            <Layers className="h-3.5 w-3.5" />
                            Overlay Model A
                        </button>
                        <button
                            onClick={() => onOverlayOnMap(result.imageB, result.bbox)}
                            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/50 bg-emerald-500/20 px-3 py-1.5 font-mono text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500 hover:text-white"
                        >
                            <Layers className="h-3.5 w-3.5" />
                            Overlay Model B
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}
