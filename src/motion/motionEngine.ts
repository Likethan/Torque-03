import gsap from 'gsap'
import { damp, clamp, mapRange } from './lerp'
import { calculateVelocity, formatVelocity, calculateSecondaryInertia } from './velocity'
import { MOTION_CONFIG } from './motionConfig'
import { formatTimecode, formatFrameNumber } from '../utils/frameMath'

export type NarrativeState = 'ARRIVAL' | 'REVEAL' | 'APPROACH' | 'FORM' | 'TRANSITION'

export interface MotionContext {
  frame: number
  progress: number
  scale: number
  offsetY: number
  velocity: number
  stateName: NarrativeState
}

export interface MotionState {
  targetProgress: number
  currentProgress: number
  velocity: number
  currentFrame: number
  previousFrame: number
  isSettled: boolean
  direction: 'forward' | 'backward' | 'settled'
  narrativeState: NarrativeState
  scale: number
  offsetY: number
}

export interface DOMBindings {
  timecodeEl?: HTMLElement | null
  frameCounterEl?: HTMLElement | null
  playheadFillEl?: HTMLElement | null
  phaseNameEl?: HTMLElement | null
  arrivalLayerEl?: HTMLElement | null
  revealLayerEl?: HTMLElement | null
  formLayerEl?: HTMLElement | null
  debugTargetEl?: HTMLElement | null
  debugCurrentEl?: HTMLElement | null
  debugVelocityEl?: HTMLElement | null
  debugFrameEl?: HTMLElement | null
  debugPhaseEl?: HTMLElement | null
  debugStatusEl?: HTMLElement | null
}

export type FrameRenderCallback = (context: MotionContext) => void
export type MotionListener = (state: MotionState) => void

/**
 * JavaScript Motion Engine (Step 5 - Motion Mathematics)
 *
 * Implements mathematical motion model:
 * USER INPUT (Scroll)
 *   ↓
 * TARGET PROGRESS
 *   ↓
 * DAMPED LERP (progressSmoothing = 0.08)
 *   ↓
 * CURRENT PROGRESS
 *   ↓
 * INSTANTANEOUS VELOCITY (frame-to-frame delta)
 *   ↓
 * PRIMARY MOTION (mapRange progress -> scale, y)
 *   +
 * SECONDARY MOTION (clamped velocity inertia offset)
 *   ↓
 * DIRECT COMPOSITOR RENDER (transforms & opacity, zero React state re-render)
 */
export class MotionEngine {
  private targetProgress = 0
  private currentProgress = 0
  private previousProgress = 0
  private velocity = 0
  private currentFrame = 0
  private previousFrame = -1
  private isSettled = true
  private isRunning = false

  private primaryScale = 1.0
  private primaryY = 0
  private secondaryScale = 0
  private secondaryY = 0
  private effectiveScale = 1.0
  private effectiveY = 0

  private narrativeState: NarrativeState = 'ARRIVAL'

  private domBindings: DOMBindings = {}
  private frameRenderers = new Set<FrameRenderCallback>()
  private stateListeners = new Set<MotionListener>()

  private smoothing: number = MOTION_CONFIG.progressSmoothing
  private epsilon: number = MOTION_CONFIG.epsilon
  private totalFrames: number = MOTION_CONFIG.totalFrames

  constructor(customSmoothing?: number) {
    if (customSmoothing !== undefined) {
      this.smoothing = customSmoothing
    }
  }

  /**
   * Updates target scroll progress.
   * Called by the passive scroll listener.
   */
  public setTargetProgress(target: number): void {
    const clamped = clamp(target, 0, 1)
    if (this.targetProgress !== clamped) {
      this.targetProgress = clamped
      this.isSettled = false
    }
  }

  public registerDOMBindings(bindings: DOMBindings): void {
    this.domBindings = { ...this.domBindings, ...bindings }
  }

  public registerFrameRenderer(renderer: FrameRenderCallback): () => void {
    this.frameRenderers.add(renderer)
    // Trigger initial render
    renderer({
      frame: this.currentFrame,
      progress: this.currentProgress,
      scale: this.effectiveScale,
      offsetY: this.effectiveY,
      velocity: this.velocity,
      stateName: this.narrativeState,
    })
    return () => this.frameRenderers.delete(renderer)
  }

  public subscribe(listener: MotionListener): () => void {
    this.stateListeners.add(listener)
    return () => this.stateListeners.delete(listener)
  }

  public start(): void {
    if (this.isRunning) return
    this.isRunning = true
    gsap.ticker.add(this.tick)
  }

  public stop(): void {
    this.isRunning = false
    gsap.ticker.remove(this.tick)
  }

  public getState(): MotionState {
    const dir =
      this.velocity > 0.0001 ? 'forward' : this.velocity < -0.0001 ? 'backward' : 'settled'

    return {
      targetProgress: this.targetProgress,
      currentProgress: this.currentProgress,
      velocity: this.velocity,
      currentFrame: this.currentFrame,
      previousFrame: this.previousFrame,
      isSettled: this.isSettled,
      direction: dir,
      narrativeState: this.narrativeState,
      scale: this.effectiveScale,
      offsetY: this.effectiveY,
    }
  }

  /**
   * Unified Ticker Tick (Synchronized with GSAP + Lenis RAF)
   */
  private tick = (): void => {
    if (!this.isRunning) return

    this.updateMotion()
    this.render()
  }

  /**
   * Mathematical Motion Calculations
   */
  private updateMotion(): void {
    this.previousProgress = this.currentProgress

    // 1. Damped Linear Interpolation (Target vs Current)
    this.currentProgress = damp(
      this.currentProgress,
      this.targetProgress,
      this.smoothing,
      this.epsilon
    )

    // 2. Velocity Calculation (Progress rate of change per frame)
    this.velocity = calculateVelocity(this.currentProgress, this.previousProgress)

    // Check if settled
    const deltaTarget = Math.abs(this.targetProgress - this.currentProgress)
    this.isSettled = deltaTarget < this.epsilon && Math.abs(this.velocity) < this.epsilon

    if (this.isSettled) {
      this.velocity = 0
    }

    // 3. Integer Frame Derivation
    this.currentFrame = clamp(
      Math.round(this.currentProgress * (this.totalFrames - 1)),
      0,
      this.totalFrames - 1
    )

    // 4. Primary Motion Calculation (Mapped continuously from progress)
    const v = MOTION_CONFIG.vehicle
    this.primaryScale = mapRange(this.currentProgress, 0.2, 0.85, v.scaleStart, v.scaleEnd)
    this.primaryY = mapRange(this.currentProgress, 0.2, 0.85, v.yStart, v.yEnd)

    // 5. Secondary Motion Calculation (Subtle inertia derived from velocity)
    const s = MOTION_CONFIG.secondaryMotion
    this.secondaryScale = calculateSecondaryInertia(
      this.velocity,
      s.inertiaScaleFactor,
      s.maxInertiaScale
    )
    this.secondaryY = calculateSecondaryInertia(this.velocity, s.inertiaYFactor, s.maxInertiaY)

    // Effective combined motion:
    this.effectiveScale = this.primaryScale + this.secondaryScale
    this.effectiveY = this.primaryY + this.secondaryY

    // 6. Narrative Threshold Detection
    const p = this.currentProgress
    const th = MOTION_CONFIG.thresholds
    if (p >= th.transition.start) {
      this.narrativeState = 'TRANSITION'
    } else if (p >= th.form.start) {
      this.narrativeState = 'FORM'
    } else if (p >= th.approach.start) {
      this.narrativeState = 'APPROACH'
    } else if (p >= th.reveal.start) {
      this.narrativeState = 'REVEAL'
    } else {
      this.narrativeState = 'ARRIVAL'
    }

    // Notify listeners if progress changed meaningfully
    if (Math.abs(this.previousProgress - this.currentProgress) > 0.00001 || !this.isSettled) {
      const state = this.getState()
      for (const listener of this.stateListeners) {
        listener(state)
      }
    }
  }

  /**
   * Direct DOM & Canvas Rendering (Compositor-only)
   */
  private render(): void {
    const frame = this.currentFrame
    const p = this.currentProgress

    // 1. Canvas Frame Redraw with Deduplication
    const isApproachPhase = frame >= 20 && frame <= 88
    const frameChanged = frame !== this.previousFrame
    const hasSecondaryMotion = Math.abs(this.velocity) > 0.0002

    if (frameChanged || (!this.isSettled && (isApproachPhase || hasSecondaryMotion))) {
      const context: MotionContext = {
        frame,
        progress: p,
        scale: this.effectiveScale,
        offsetY: this.effectiveY,
        velocity: this.velocity,
        stateName: this.narrativeState,
      }
      for (const render of this.frameRenderers) {
        render(context)
      }
      this.previousFrame = frame
    }

    // 2. Direct DOM Bindings
    const {
      timecodeEl,
      frameCounterEl,
      playheadFillEl,
      phaseNameEl,
      arrivalLayerEl,
      revealLayerEl,
      formLayerEl,
      debugTargetEl,
      debugCurrentEl,
      debugVelocityEl,
      debugFrameEl,
      debugPhaseEl,
      debugStatusEl,
    } = this.domBindings

    // Top HUD Timecode & Frame Counter
    if (timecodeEl) {
      timecodeEl.textContent = formatTimecode(frame, MOTION_CONFIG.fps)
    }
    if (frameCounterEl) {
      frameCounterEl.textContent = formatFrameNumber(frame, this.totalFrames)
    }
    if (playheadFillEl) {
      playheadFillEl.style.width = `${(p * 100).toFixed(2)}%`
    }

    // Phase Tag
    if (phaseNameEl) {
      const codeMap: Record<NarrativeState, string> = {
        ARRIVAL: 'PH-01 // 01 ARRIVAL',
        REVEAL: 'PH-02 // 02 REVEAL',
        APPROACH: 'PH-03 // 03 APPROACH',
        FORM: 'PH-04 // 04 FORM',
        TRANSITION: 'PH-05 // 05 TRANSITION',
      }
      phaseNameEl.textContent = codeMap[this.narrativeState]
    }

    // Continuous Transform-First Typographic Opacities
    if (arrivalLayerEl) {
      const arrOpacity = mapRange(p, 0.1, 0.25, 1, 0)
      const arrY = mapRange(p, 0, 0.25, 0, -45) + this.secondaryY * 0.4
      arrivalLayerEl.style.opacity = arrOpacity.toFixed(3)
      arrivalLayerEl.style.transform = `translate3d(0, ${arrY.toFixed(1)}px, 0)`
      arrivalLayerEl.style.pointerEvents = arrOpacity > 0.3 ? 'auto' : 'none'
    }

    if (revealLayerEl) {
      const revOpacity = mapRange(p, 0.12, 0.22, 1, 0)
      const revY = mapRange(p, 0, 0.22, 0, -35) + this.secondaryY * 0.4
      revealLayerEl.style.opacity = revOpacity.toFixed(3)
      revealLayerEl.style.transform = `translate3d(0, ${revY.toFixed(1)}px, 0)`
      revealLayerEl.style.pointerEvents = revOpacity > 0.3 ? 'auto' : 'none'
    }

    if (formLayerEl) {
      const formOpacity =
        p < 0.68
          ? 0
          : p > 0.94
          ? mapRange(p, 0.94, 1.0, 1, 0)
          : mapRange(p, 0.68, 0.82, 0, 1)

      formLayerEl.style.opacity = formOpacity.toFixed(3)
      formLayerEl.style.pointerEvents = formOpacity > 0.3 ? 'auto' : 'none'
    }

    // Development Debug Telemetry (Section 18)
    if (debugTargetEl) {
      debugTargetEl.textContent = this.targetProgress.toFixed(3)
    }
    if (debugCurrentEl) {
      debugCurrentEl.textContent = this.currentProgress.toFixed(3)
    }
    if (debugVelocityEl) {
      debugVelocityEl.textContent = formatVelocity(this.velocity)
      debugVelocityEl.style.color =
        Math.abs(this.velocity) > 0.0005 ? 'var(--color-accent-red)' : 'var(--color-text-tertiary)'
    }
    if (debugFrameEl) {
      debugFrameEl.textContent = `${frame} / ${this.totalFrames}`
    }
    if (debugPhaseEl) {
      debugPhaseEl.textContent = this.narrativeState
    }
    if (debugStatusEl) {
      debugStatusEl.textContent = this.isSettled ? 'SETTLED' : 'INTERPOLATING'
      debugStatusEl.style.color = this.isSettled ? 'var(--color-accent)' : 'var(--color-accent-red)'
    }
  }
}
