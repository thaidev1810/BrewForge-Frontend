import { useEffect, useRef, useState } from 'react'
import { coffeePalette, createCoffeeRenderer } from '@/lib/coffee'
import { cn } from '@/utils/cn'

interface CoffeeCanvasProps {
  /** Scene seed: 0 latte art, 1 beans, 2 espresso, 3 cream swirl, 4 iced coffee (any number works, the scene is seed mod 5). */
  seed?: number
  palette?: string
  zoom?: number
  /** Render scale relative to the element size. Lower is lighter on the GPU. */
  quality?: number
  className?: string
}

/** A living coffee picture drawn with WebGL. Pauses off-screen and when the tab is hidden, and draws one still frame for reduced motion. */
export function CoffeeCanvas({ seed = 0, palette = 'espresso', zoom = 1.2, quality = 0.7, className }: CoffeeCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const renderer = createCoffeeRenderer(canvas)
    if (!renderer) {
      setFailed(true)
      return
    }
    const pal = coffeePalette(palette)
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let visible = true
    let time = 6 + (seed % 7)
    let last = performance.now()
    let lastDraw = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * quality
      const w = Math.max(32, Math.round(canvas.clientWidth * dpr))
      const h = Math.max(32, Math.round(canvas.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }
    const paint = () => {
      resize()
      renderer.draw(time, seed, pal, pal, 0, zoom)
    }
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      time += Math.min(0.05, (now - last) / 1000)
      last = now
      if (!visible || document.hidden || now - lastDraw < 32) return
      lastDraw = now
      paint()
    }
    paint()
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    io.observe(canvas)
    const ro = new ResizeObserver(() => paint())
    ro.observe(canvas)
    if (!still) raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      renderer.dispose()
    }
  }, [seed, palette, zoom, quality])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={cn('block size-full', failed && 'bg-[radial-gradient(circle_at_30%_30%,#8f5b3e,#2a160e_70%)]', className)}
    />
  )
}
