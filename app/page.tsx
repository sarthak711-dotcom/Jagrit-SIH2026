"use client"

import { useState } from "react"
import { StartScreen } from "@/components/start-screen"
import { MapWorkspace } from "@/components/map-workspace"

export default function Page() {
  const [started, setStarted] = useState(false)

  return started ? (
    <MapWorkspace />
  ) : (
    <StartScreen onStart={() => setStarted(true)} />
  )
}
