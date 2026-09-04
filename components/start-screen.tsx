"use client"

import { ArrowRight } from "lucide-react"

export function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background">
      {/* Earth-from-space visual */}
      <div className="pointer-events-none absolute inset-0 select-none">
        <img
          src="/earth-limb.png"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover opacity-60"
        />
        {/* Vignette + fade to keep the visual minimal and readable */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_20%,transparent_0%,var(--background)_82%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
      </div>

      {/* Faint reference grid for the instrument feel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div className="mb-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
          <span className="h-1.5 w-1.5 bg-primary" />
          Earth Observation
        </div>

        <h1 className="font-mono text-4xl font-semibold tracking-[0.18em] text-foreground sm:text-6xl">
          JAGRIT
        </h1>

        <p className="mt-5 max-w-md text-pretty text-base text-foreground/80 sm:text-lg">
          Satellite Super-Resolution &amp; Analysis
        </p>

        <p className="mt-2 font-mono text-sm tracking-wide text-muted-foreground">
          Sentinel-2 10 m {"->"} 2.5 m
        </p>

        <button
          type="button"
          onClick={onStart}
          className="group mt-10 inline-flex items-center gap-2.5 border border-primary/60 bg-primary/10 px-6 py-3 font-mono text-sm uppercase tracking-[0.2em] text-foreground transition-colors hover:border-primary hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Start Exploring
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Corner instrument readouts */}
      <div className="absolute bottom-4 left-4 z-10 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
        v0.1 · MSI L2A
      </div>
      <div className="absolute bottom-4 right-4 z-10 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
        EPSG:3857
      </div>
    </main>
  )
}
