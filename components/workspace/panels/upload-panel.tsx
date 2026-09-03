"use client"

import { useRef, useState } from "react"
import { UploadCloud, FileImage } from "lucide-react"
import { PanelShell, MetaRow } from "@/components/workspace/panel-shell"

export type UploadedImage = {
  name: string
  source: string
  resolution: string
  acquisition: string
  cloudCover: string
  bands: string
  lat: string
  lng: string
}

// Mock Sentinel-2 metadata used regardless of the actual dropped file.
function mockMetadata(name?: string): UploadedImage {
  return {
    name: name || "S2_Bhubaneswar_2026.tif",
    source: "Sentinel-2",
    resolution: "10 m / pixel",
    acquisition: "12 Aug 2026",
    cloudCover: "3.2%",
    bands: "RGB",
    lat: "20.2961° N",
    lng: "85.8245° E",
  }
}

export function UploadPanel({
  onClose,
  image,
  onFile,
  onLoad,
}: {
  onClose: () => void
  image: UploadedImage | null
  onFile: (img: UploadedImage) => void
  onLoad: () => void
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const accept = (fileName?: string) => onFile(mockMetadata(fileName))

  return (
    <PanelShell title="Satellite Image" onClose={onClose}>
      {!image ? (
        <div className="p-3">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              accept(e.dataTransfer.files?.[0]?.name)
            }}
            onClick={() => inputRef.current?.click()}
            className={[
              "flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-3 py-6 text-center transition-colors",
              dragging
                ? "border-primary/70 bg-primary/5"
                : "border-border hover:border-muted-foreground/50",
            ].join(" ")}
          >
            <UploadCloud className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
            <p className="font-mono text-xs text-foreground">Drop Sentinel-2 imagery here</p>
            <p className="font-mono text-[10px] text-muted-foreground/60">or choose a file</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".tif,.tiff,.png,image/tiff,image/png"
            className="sr-only"
            onChange={(e) => accept(e.target.files?.[0]?.name)}
          />
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">
            Supported: GeoTIFF · TIFF · PNG
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <FileImage className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
            <span className="truncate font-mono text-xs text-foreground">{image.name}</span>
          </div>
          <div className="divide-y divide-border/60 py-0.5">
            <MetaRow label="Source" value={image.source} />
            <MetaRow label="Resolution" value={image.resolution} />
            <MetaRow label="Acquisition" value={image.acquisition} />
            <MetaRow label="Cloud Cover" value={image.cloudCover} />
            <MetaRow label="Bands" value={image.bands} />
            <MetaRow label="Coordinates" value={`${image.lat}, ${image.lng}`} />
          </div>
          <div className="border-t border-border p-3">
            <button
              type="button"
              onClick={onLoad}
              className="w-full bg-primary py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-primary-foreground transition-opacity hover:opacity-90"
            >
              Load Image
            </button>
          </div>
        </>
      )}
    </PanelShell>
  )
}
