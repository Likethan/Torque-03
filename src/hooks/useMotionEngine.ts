import { useEffect, useRef, type RefObject } from 'react'
import { MotionEngine } from '../motion/motionEngine'
import { calculateNormalizedProgress } from '../utils/frameMath'

interface UseMotionEngineOptions {
  smoothing?: number
  externalScrub?: boolean
}

/**
 * useMotionEngine Hook
 *
 * Integrates the MotionEngine with the React component lifecycle:
 * - Initializes the single unified ticker loop on mount (via GSAP ticker)
 * - If not externally scrubbed, binds passive scroll listener
 * - Cleans up ticker and event listeners on unmount
 * - Respects prefers-reduced-motion
 */
export function useMotionEngine(
  containerRef: RefObject<HTMLElement | null>,
  options: UseMotionEngineOptions = {}
) {
  const engineRef = useRef<MotionEngine | null>(null)

  if (!engineRef.current) {
    engineRef.current = new MotionEngine(options.smoothing)
  }

  useEffect(() => {
    const engine = engineRef.current
    const container = containerRef.current
    if (!engine || !container) return

    // Accessibility check: disable continuous motion if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      engine.setTargetProgress(0.6)
      return
    }

    engine.start()

    // If externally scrubbed (e.g. by ScrollTrigger), avoid duplicate window scroll listener
    if (options.externalScrub) {
      return () => {
        engine.stop()
      }
    }

    // Passive scroll handler: ONLY updates targetProgress when not externally scrubbed
    const onScroll = () => {
      const rect = container.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const target = calculateNormalizedProgress(rect.top, rect.height, windowHeight)
      engine.setTargetProgress(target)
    }

    const onResize = () => {
      onScroll()
    }

    // Initial sync
    onScroll()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })

    return () => {
      engine.stop()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [containerRef, options.externalScrub])

  return engineRef.current
}
