"use client"

import { useEffect, useId, useState, type ComponentProps } from "react"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import { loadSlim } from "@tsparticles/slim"

type SparklesProps = {
  className?: string
  size?: number
  minSize?: number | null
  density?: number
  speed?: number
  minSpeed?: number | null
  opacity?: number
  opacitySpeed?: number
  minOpacity?: number | null
  color?: string
  background?: string
  options?: ComponentProps<typeof Particles>["options"]
}

/**
 * A tsparticles canvas. Heavy (about 100 kB of script and a constant
 * animation loop): load it with next/dynamic ({ ssr: false }) and only render
 * it once the page is idle, on larger screens, without reduced motion (see
 * components/landing/partners-sponsors.tsx).
 */
export function Sparkles({
  className,
  size = 1,
  minSize = null,
  density = 800,
  speed = 1,
  minSpeed = null,
  opacity = 1,
  opacitySpeed = 3,
  minOpacity = null,
  color = "#FFFFFF",
  background = "transparent",
  options = {},
}: SparklesProps) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => {
      setIsReady(true)
    })
  }, [])

  const id = useId()

  const defaultOptions = {
    background: {
      color: {
        value: background,
      },
    },
    fullScreen: {
      enable: false,
      zIndex: 1,
    },
    // Decoration: 60 fps is plenty and halves the work on high-refresh screens.
    fpsLimit: 60,
    particles: {
      color: {
        value: color,
      },
      move: {
        enable: true,
        direction: "none" as const,
        speed: {
          min: minSpeed || speed / 10,
          max: speed,
        },
        straight: false,
      },
      number: {
        value: density,
      },
      opacity: {
        value: {
          min: minOpacity || opacity / 10,
          max: opacity,
        },
        animation: {
          enable: true,
          sync: false,
          speed: opacitySpeed,
        },
      },
      size: {
        value: {
          min: minSize || size / 2.5,
          max: size,
        },
      },
    },
    detectRetina: true,
  }

  if (!isReady) return null
  // Decorative: keep the canvas away from screen readers.
  return (
    <div aria-hidden="true" className={className}>
      <Particles id={id} options={{ ...defaultOptions, ...options }} className="absolute inset-0" />
    </div>
  )
}
