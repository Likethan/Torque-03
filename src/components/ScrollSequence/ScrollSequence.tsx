import React, { useRef, useEffect, useCallback } from 'react'
import { useFramePreloader } from '../../hooks/useFramePreloader'
import { MOTION_CONFIG } from '../../motion/motionConfig'
import { lerp, clamp } from '../../motion/lerp'
import type { MotionEngine, MotionContext } from '../../motion/motionEngine'
import { registerInteractionDOMBindings } from '../../interaction/interactionStore'
import './ScrollSequence.css'

interface ScrollSequenceProps {
  engine: MotionEngine
  containerRef: React.RefObject<HTMLDivElement | null>
  totalFrames?: number
  stageHeight?: string
  children?: React.ReactNode
}

/**
 * ScrollSequence Component (Step 5 - Motion Mathematics)
 *
 * Canvas-based frame renderer driven by the centralized MotionEngine.
 * Applies Primary Motion (mapped scale/offset) combined with Secondary Motion
 * (velocity-driven physical inertia) for a weighted cinematic camera feel.
 */
export function ScrollSequence({
  engine,
  containerRef,
  totalFrames = MOTION_CONFIG.totalFrames,
  stageHeight = 'var(--cinema-height-desktop, 350vh)',
  children,
}: ScrollSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const vehicleRigRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    registerInteractionDOMBindings({
      vehicleRigEl: vehicleRigRef.current,
    })
  }, [])

  const { getImage, isLoaded, fallbackImage } = useFramePreloader({
    totalFrames,
    fallbackSource: '/images/accord-hero.jpg',
  })

  /**
   * High-Performance Canvas Frame Renderer
   * Directly consumes mathematically combined primary and secondary motion values
   */
  const renderFrame = useCallback(
    (frame: number, cameraScale: number = 1.0, cameraOffsetY: number = 0, velocity: number = 0) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const img = getImage(frame) || fallbackImage
      if (!img || !img.complete || img.naturalWidth === 0) return

      const width = canvas.width
      const height = canvas.height

      ctx.clearRect(0, 0, width, height)

      // 1. Studio Floor Base (Near-black automotive studio)
      ctx.fillStyle = 'hsl(220, 10%, 6%)'
      ctx.fillRect(0, 0, width, height)

      // Radial backdrop glow with subtle velocity inertia shift
      const s = MOTION_CONFIG.secondaryMotion
      const bgShiftX = clamp(velocity * s.bgShiftFactor * width, -s.maxBgShift, s.maxBgShift)

      const bgGlow = ctx.createRadialGradient(
        width * 0.5 + bgShiftX,
        height * 0.52,
        width * 0.1,
        width * 0.5,
        height * 0.52,
        width * 0.65
      )
      const glowIntensity = lerp(0.04, 0.16, clamp(frame / 60, 0, 1))
      bgGlow.addColorStop(0, `hsla(38, 20%, 30%, ${glowIntensity})`)
      bgGlow.addColorStop(1, 'transparent')
      ctx.fillStyle = bgGlow
      ctx.fillRect(0, 0, width, height)

      // 2. Aspect Cover Geometry
      const imgAspect = img.naturalWidth / img.naturalHeight
      const canvasAspect = width / height

      let drawW: number
      let drawH: number

      if (canvasAspect > imgAspect) {
        drawW = width
        drawH = width / imgAspect
      } else {
        drawH = height
        drawW = height * imgAspect
      }

      const drawX = (width - drawW) / 2
      const drawY = (height - drawH) / 2 + cameraOffsetY

      // 3. Apply Camera Transform (Primary scale + secondary velocity inertia)
      ctx.save()
      ctx.translate(width / 2, height * 0.52)
      ctx.scale(cameraScale, cameraScale)
      ctx.translate(-width / 2, -height * 0.52)

      // Draw photographic vehicle plate
      ctx.drawImage(img, drawX, drawY, drawW, drawH)
      ctx.restore()

      // 4. Studio Lighting Sweep
      const v = MOTION_CONFIG.vehicle
      const shadowDarkness = lerp(
        v.shadowDarknessStart,
        v.shadowDarknessEnd,
        clamp(frame / (v.shadowFadeEnd * 100), 0, 1)
      )
      if (shadowDarkness > 0.01) {
        ctx.fillStyle = `hsla(220, 10%, 6%, ${shadowDarkness})`
        ctx.fillRect(0, 0, width, height)
      }

      // Key light sweep across front quarter
      const sweepProgress = clamp((frame - 10) / 40, 0, 1)
      if (sweepProgress < 0.99) {
        const sweepGradient = ctx.createLinearGradient(
          width * 0.15,
          height * 0.4,
          width * 0.85,
          height * 0.6
        )
        const frontLight = lerp(0.0, 0.45, sweepProgress)
        const rearDark = lerp(0.65, 0.0, sweepProgress)
        sweepGradient.addColorStop(0, `hsla(220, 10%, 6%, ${frontLight})`)
        sweepGradient.addColorStop(1, `hsla(220, 10%, 6%, ${rearDark})`)
        ctx.fillStyle = sweepGradient
        ctx.fillRect(0, 0, width, height)
      }

      // 5. Studio Floor Shadow & Top Edge Letterbox
      const groundShadow = ctx.createLinearGradient(0, height * 0.7, 0, height)
      groundShadow.addColorStop(0, 'transparent')
      groundShadow.addColorStop(0.5, 'hsla(220, 10%, 6%, 0.65)')
      groundShadow.addColorStop(1, 'hsla(220, 10%, 6%, 0.95)')
      ctx.fillStyle = groundShadow
      ctx.fillRect(0, height * 0.7, width, height * 0.3)

      const topVignette = ctx.createLinearGradient(0, 0, 0, height * 0.3)
      topVignette.addColorStop(0, 'hsla(220, 10%, 6%, 0.85)')
      topVignette.addColorStop(1, 'transparent')
      ctx.fillStyle = topVignette
      ctx.fillRect(0, 0, width, height * 0.3)
    },
    [getImage, fallbackImage]
  )

  // Register canvas renderer with MotionEngine
  useEffect(() => {
    const unregister = engine.registerFrameRenderer((context: MotionContext) => {
      renderFrame(context.frame, context.scale, context.offsetY, context.velocity)
    })
    return unregister
  }, [engine, renderFrame])

  // Canvas DPI sync on resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = window.innerWidth
      const h = window.innerHeight

      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`

      const state = engine.getState()
      renderFrame(state.currentFrame, state.scale, state.offsetY, state.velocity)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [engine, renderFrame, isLoaded])

  return (
    <div
      ref={containerRef}
      className="scroll-sequence-track"
      style={{ height: stageHeight }}
    >
      <div className="scroll-sequence-sticky">
        <div ref={vehicleRigRef} className="scroll-sequence-interaction-rig">
          <canvas ref={canvasRef} className="scroll-sequence-canvas" />
        </div>
        <div className="scroll-sequence-film-overlay" aria-hidden="true" />
        {children}
      </div>
    </div>
  )
}
