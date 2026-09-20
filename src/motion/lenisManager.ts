import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '../animation/gsapConfig'

import { setScrollMotion } from './unifiedMotion'
import { setMasterCinematicProgress } from '../animation/cinematicDirector'

// Register ScrollTrigger plugin with GSAP (Step 9)
gsap.registerPlugin(ScrollTrigger)

export interface LenisTelemetry {
  scroll: number
  progress: number
  velocity: number
  direction: 'DOWN' | 'UP' | 'IDLE'
  isScrolling: boolean
  isEnabled: boolean
}

export interface LenisDOMBindings {
  scrollEl?: HTMLElement | null
  progressEl?: HTMLElement | null
  velocityEl?: HTMLElement | null
  directionEl?: HTMLElement | null
  statusEl?: HTMLElement | null
}

type TelemetryListener = (telemetry: LenisTelemetry) => void

let lenisInstance: Lenis | null = null
let tickerCallback: ((time: number) => void) | null = null
let isSmoothEnabled = true
let instanceRefCount = 0
const telemetryListeners = new Set<TelemetryListener>()
let activeDOMBindings: LenisDOMBindings = {}

let currentTelemetry: LenisTelemetry = {
  scroll: 0,
  progress: 0,
  velocity: 0,
  direction: 'IDLE',
  isScrolling: false,
  isEnabled: true,
}

/**
 * Normalizes document-level scroll progress to a clamped range of 0.000 to 1.000
 *
 * progress = scrollPosition / (documentHeight - viewportHeight)
 */
export function calculateDocumentProgress(scroll: number): number {
  if (typeof document === 'undefined') return 0
  const docHeight = document.documentElement.scrollHeight
  const winHeight = window.innerHeight
  const maxScroll = docHeight - winHeight
  if (maxScroll <= 0) return 0
  return Math.min(Math.max(scroll / maxScroll, 0), 1)
}

/**
 * ----------------------------------------------------------------------------
 * LENIS MANAGER (Step 8 — Smooth Scrolling with Lenis)
 * ----------------------------------------------------------------------------
 * Manages the global virtual scroll engine:
 * 1. Synchronizes virtual scroll physics with GSAP's precision ticker (1 unified RAF).
 * 2. Provides luxurious physical deceleration for mouse wheel & trackpad inputs.
 * 3. Handles smooth anchor navigation (scrollTo).
 * 4. Respects prefers-reduced-motion accessibility preferences.
 * 5. Provides live development telemetry and A/B toggle for stepped vs smooth scroll.
 * 6. Supports direct DOM bindings to avoid React re-rendering on high-frequency scroll.
 */
export function initLenis(): Lenis | null {
  if (typeof window === 'undefined') return null

  instanceRefCount++

  // If already initialized, return existing instance (prevents React StrictMode duplicates)
  if (lenisInstance) return lenisInstance

  // Accessibility check: Do not initialize smooth inertial scrolling if user prefers reduced motion
  if (prefersReducedMotion()) {
    currentTelemetry.isEnabled = false
    notifyListeners()
    return null
  }

  // 1. Instantiate Lenis with tailored automotive luxury physical lerp
  // Linear interpolation physics: responsive initiation, buttery smooth inertial glide
  lenisInstance = new Lenis({
    lerp: 0.085,
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.95,
    touchMultiplier: 1.4,
    autoRaf: false,
    infinite: false,
  })

  isSmoothEnabled = true
  currentTelemetry.isEnabled = true

  // 2. Synchronize Lenis with GSAP's ticker (SINGLE RAF LOOP RULE)
  // We feed GSAP's frame time into lenis.raf(time * 1000).
  tickerCallback = (time: number) => {
    if (lenisInstance && isSmoothEnabled) {
      lenisInstance.raf(time * 1000)
    }
  }

  gsap.ticker.add(tickerCallback)
  // Disable GSAP lag smoothing to eliminate ticker delta clamping during heavy 3D rendering
  gsap.ticker.lagSmoothing(0)

  // 3. Bridge Lenis scroll events to ScrollTrigger (Official GSAP + Lenis integration)
  lenisInstance.on('scroll', ScrollTrigger.update)

  // 4. Track Telemetry for Dev Monitor and Direct DOM Updates
  lenisInstance.on(
    'scroll',
    (e: {
      scroll: number
      velocity: number
      direction: number
      progress?: number
      limit?: number
    }) => {
      const progress =
        e.limit && e.limit > 0
          ? Math.min(Math.max(e.scroll / e.limit, 0), 1)
          : calculateDocumentProgress(e.scroll)

      const dir: 'DOWN' | 'UP' | 'IDLE' =
        e.velocity > 0.04 || e.direction === 1
          ? 'DOWN'
          : e.velocity < -0.04 || e.direction === -1
          ? 'UP'
          : 'IDLE'

      currentTelemetry = {
        scroll: e.scroll,
        progress,
        velocity: e.velocity,
        direction: dir,
        isScrolling: Math.abs(e.velocity) > 0.05,
        isEnabled: isSmoothEnabled,
      }

      updateDOMBindings(currentTelemetry)
      notifyListeners()

      // Step 19: Authoritative write to Unified Motion State
      setScrollMotion(
        progress,
        e.velocity,
        dir === 'DOWN' ? 1 : dir === 'UP' ? -1 : 0
      )

      // Step 14: Synchronize Master Cinematic Director State
      setMasterCinematicProgress(progress, e.velocity)
    }
  )

  notifyListeners()
  return lenisInstance
}

export function getLenis(): Lenis | null {
  return lenisInstance
}

/**
 * Registers direct DOM references for high-frequency updates (0 React re-renders).
 */
export function registerLenisDOMBindings(bindings: LenisDOMBindings): void {
  activeDOMBindings = { ...activeDOMBindings, ...bindings }
  updateDOMBindings(currentTelemetry)
}

function updateDOMBindings(telemetry: LenisTelemetry): void {
  if (activeDOMBindings.scrollEl) {
    activeDOMBindings.scrollEl.textContent = `${telemetry.scroll.toFixed(1)} px`
  }
  if (activeDOMBindings.progressEl) {
    activeDOMBindings.progressEl.textContent = telemetry.progress.toFixed(4)
  }
  if (activeDOMBindings.velocityEl) {
    activeDOMBindings.velocityEl.textContent = `${
      telemetry.velocity >= 0 ? '+' : ''
    }${telemetry.velocity.toFixed(3)} px/f`
  }
  if (activeDOMBindings.directionEl) {
    activeDOMBindings.directionEl.textContent = telemetry.direction
    activeDOMBindings.directionEl.style.color =
      telemetry.direction === 'DOWN'
        ? 'var(--color-accent)'
        : telemetry.direction === 'UP'
        ? 'var(--color-accent-red)'
        : 'var(--color-text-tertiary)'
  }
  if (activeDOMBindings.statusEl) {
    activeDOMBindings.statusEl.textContent = telemetry.isEnabled ? 'ACTIVE' : 'DISABLED'
    activeDOMBindings.statusEl.style.color = telemetry.isEnabled
      ? 'var(--color-accent)'
      : 'var(--color-text-muted)'
  }
}

/**
 * Smoothly scrolls to an anchor selector or DOM element using Lenis physics.
 */
export function scrollToTarget(
  target: string | HTMLElement | number,
  options: { offset?: number; duration?: number; onComplete?: () => void } = {}
): void {
  if (!lenisInstance || !isSmoothEnabled) {
    // Fallback to native smooth scroll
    if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior: 'smooth' })
    } else if (typeof target === 'string') {
      const el = document.querySelector(target)
      el?.scrollIntoView({ behavior: 'smooth' })
    } else if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
    options.onComplete?.()
    return
  }

  lenisInstance.scrollTo(target, {
    offset: options.offset ?? 0,
    duration: options.duration ?? 1.4,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    onComplete: options.onComplete,
  })
}

/**
 * Toggles Lenis smooth scrolling on/off for live development A/B comparison.
 */
export function toggleSmoothScroll(): boolean {
  if (!lenisInstance) return false

  isSmoothEnabled = !isSmoothEnabled
  currentTelemetry.isEnabled = isSmoothEnabled

  if (isSmoothEnabled) {
    lenisInstance.start()
  } else {
    lenisInstance.stop()
  }

  updateDOMBindings(currentTelemetry)
  notifyListeners()
  return isSmoothEnabled
}

export function isSmoothScrollActive(): boolean {
  return isSmoothEnabled && lenisInstance !== null
}

export function subscribeToLenis(listener: TelemetryListener): () => void {
  telemetryListeners.add(listener)
  listener(currentTelemetry)
  return () => {
    telemetryListeners.delete(listener)
  }
}

function notifyListeners() {
  for (const listener of telemetryListeners) {
    listener(currentTelemetry)
  }
}

/**
 * Cleanup function for application unmount with ref-counting protection
 */
export function destroyLenis(): void {
  instanceRefCount--
  if (instanceRefCount <= 0) {
    instanceRefCount = 0
    if (tickerCallback) {
      gsap.ticker.remove(tickerCallback)
      tickerCallback = null
    }
    gsap.ticker.lagSmoothing(500, 33)
    if (lenisInstance) {
      lenisInstance.destroy()
      lenisInstance = null
    }
    activeDOMBindings = {}
  }
}
