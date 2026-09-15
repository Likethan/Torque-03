/**
 * CENTRALIZED INTERACTION STORE
 * STEP 12 — ADVANCED INTERACTION SYSTEM
 *
 * High-frequency mutable store operating entirely outside React's render cycle.
 * Synchronizes with GSAP's precision ticker (single unified RAF loop).
 *
 * Architecture:
 * Window Pointer Events -> Target Values -> Unified RAF -> Smoothed Values -> Visual Output
 */

import gsap from 'gsap'
import { lerp } from '../motion/lerp'
import { normalizePointer, calculateVelocity } from './interactionMath'
import { prefersReducedMotion } from '../animation/gsapConfig'
import { setPointerMotion } from '../motion/unifiedMotion'

export interface InteractionState {
  pointerX: number
  pointerY: number
  normalizedX: number
  normalizedY: number
  smoothedNX: number
  smoothedNY: number
  velocityX: number
  velocityY: number
  speed: number
  isPointerInside: boolean
  activeTarget: string
  proximityStrength: number
  magneticStrength: number
  touchMode: boolean
}

export interface InteractionDOMBindings {
  pointerXYEl?: HTMLElement | null
  normalizedXYEl?: HTMLElement | null
  velocityXYEl?: HTMLElement | null
  speedEl?: HTMLElement | null
  activeTargetEl?: HTMLElement | null
  proximityStrengthEl?: HTMLElement | null
  magneticStrengthEl?: HTMLElement | null
  vehicleRigEl?: HTMLElement | null
}

export type InteractionListener = (state: Readonly<InteractionState>) => void

// Central mutable state
const state: InteractionState = {
  pointerX: 0,
  pointerY: 0,
  normalizedX: 0,
  normalizedY: 0,
  smoothedNX: 0,
  smoothedNY: 0,
  velocityX: 0,
  velocityY: 0,
  speed: 0,
  isPointerInside: false,
  activeTarget: 'NONE',
  proximityStrength: 0,
  magneticStrength: 0,
  touchMode: false,
}

// Previous frame tracking for velocity calculations
let prevX = 0
let prevY = 0
let lastMoveTime = 0
let tickerRegistered = false
let activeDOMBindings: InteractionDOMBindings = {}
const listeners = new Set<InteractionListener>()

/**
 * Updates raw pointer position from window event.
 */
export function setRawPointer(
  x: number,
  y: number,
  isTouch: boolean = false,
  winW: number = window.innerWidth,
  winH: number = window.innerHeight
): void {
  const now = performance.now()
  const dt = lastMoveTime > 0 ? (now - lastMoveTime) : 16.6

  state.pointerX = x
  state.pointerY = y
  state.isPointerInside = true
  state.touchMode = isTouch

  const { nx, ny } = normalizePointer(x, y, winW, winH)
  state.normalizedX = nx
  state.normalizedY = ny

  if (lastMoveTime > 0 && dt > 0) {
    state.velocityX = calculateVelocity(x, prevX, dt)
    state.velocityY = calculateVelocity(y, prevY, dt)
    state.speed = Math.sqrt(state.velocityX * state.velocityX + state.velocityY * state.velocityY)
  }

  prevX = x
  prevY = y
  lastMoveTime = now

  ensureTicker()
}

/**
 * Flags pointer leaving the window.
 */
export function setPointerLeave(): void {
  state.isPointerInside = false
  state.velocityX = 0
  state.velocityY = 0
  state.speed = 0
  state.activeTarget = 'NONE'
  state.proximityStrength = 0
  state.magneticStrength = 0
}

/**
 * Updates interaction context target and strengths.
 */
export function setActiveInteraction(
  targetName: string,
  proximity: number = 0,
  magnetic: number = 0
): void {
  state.activeTarget = targetName
  state.proximityStrength = proximity
  state.magneticStrength = magnetic
}

/**
 * Registers direct DOM bindings for the telemetry HUD and vehicle visual (0 React re-renders).
 */
export function registerInteractionDOMBindings(bindings: InteractionDOMBindings): void {
  activeDOMBindings = { ...activeDOMBindings, ...bindings }
  ensureTicker()
}

/**
 * Returns read-only snapshot of current interaction state.
 */
export function getInteractionState(): Readonly<InteractionState> {
  return state
}

/**
 * Subscribes a listener to interaction state updates.
 */
export function subscribeToInteraction(listener: InteractionListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Unified RAF Ticker Hook (Bound to gsap.ticker)
 * Damps normalized values for smooth camera response, decays velocity, and updates direct DOM bindings.
 */
function onTickerUpdate(_time: number, _deltaTime: number): void {
  // Smooth normalized coordinates (0.08 smoothing factor for physical weighted camera feel)
  state.smoothedNX = lerp(state.smoothedNX, state.normalizedX, 0.08)
  state.smoothedNY = lerp(state.smoothedNY, state.normalizedY, 0.08)

  // Velocity decay when pointer stops moving
  const now = performance.now()
  if (now - lastMoveTime > 40) {
    state.velocityX = lerp(state.velocityX, 0, 0.15)
    state.velocityY = lerp(state.velocityY, 0, 0.15)
    state.speed = lerp(state.speed, 0, 0.15)
  }

  // INTERACTION 1: Accord Visual Pointer Response (Perspective camera tilt + translation)
  if (activeDOMBindings.vehicleRigEl) {
    if (!state.touchMode && !prefersReducedMotion()) {
      // Base restrained angles (pitch: up to 1.8 deg, yaw: up to 2.2 deg)
      const baseTiltX = -state.smoothedNY * 1.8
      const baseTiltY = state.smoothedNX * 2.2
      const transX = state.smoothedNX * 12
      const transY = state.smoothedNY * 8

      // Subtle velocity response (Requirement 15: fast pointer movement -> subtle secondary tilt boost)
      const velFactor = Math.min(0.4, state.speed * 0.08)
      const finalTiltX = baseTiltX * (1 + velFactor)
      const finalTiltY = baseTiltY * (1 + velFactor)

      activeDOMBindings.vehicleRigEl.style.transform = 
        `perspective(1200px) rotateX(${finalTiltX.toFixed(2)}deg) rotateY(${finalTiltY.toFixed(2)}deg) translate3d(${transX.toFixed(1)}px, ${transY.toFixed(1)}px, 0)`
    } else {
      activeDOMBindings.vehicleRigEl.style.transform = 'none'
    }
  }

  // Direct DOM Telemetry updates (0 React re-renders)
  if (activeDOMBindings.pointerXYEl) {
    activeDOMBindings.pointerXYEl.textContent = `(${Math.round(state.pointerX)}, ${Math.round(state.pointerY)})`
  }
  if (activeDOMBindings.normalizedXYEl) {
    const signX = state.normalizedX >= 0 ? '+' : ''
    const signY = state.normalizedY >= 0 ? '+' : ''
    activeDOMBindings.normalizedXYEl.textContent = `(${signX}${state.normalizedX.toFixed(2)}, ${signY}${state.normalizedY.toFixed(2)})`
  }
  if (activeDOMBindings.velocityXYEl) {
    activeDOMBindings.velocityXYEl.textContent = `${state.velocityX.toFixed(2)}, ${state.velocityY.toFixed(2)}`
  }
  if (activeDOMBindings.speedEl) {
    activeDOMBindings.speedEl.textContent = `${state.speed.toFixed(2)} px/ms`
  }

  // Step 19: Authoritative write to Unified Motion State
  setPointerMotion(
    state.pointerX,
    state.pointerY,
    state.smoothedNX,
    state.smoothedNY,
    state.speed * 60 // px/sec
  )
  if (activeDOMBindings.activeTargetEl) {
    activeDOMBindings.activeTargetEl.textContent = state.activeTarget
    activeDOMBindings.activeTargetEl.style.color =
      state.activeTarget !== 'NONE' ? 'var(--color-accent-red)' : 'var(--color-accent)'
  }
  if (activeDOMBindings.proximityStrengthEl) {
    activeDOMBindings.proximityStrengthEl.textContent = state.proximityStrength.toFixed(3)
  }
  if (activeDOMBindings.magneticStrengthEl) {
    activeDOMBindings.magneticStrengthEl.textContent = state.magneticStrength.toFixed(3)
  }

  // Notify listeners if any
  listeners.forEach((listener) => listener(state))
}

function ensureTicker(): void {
  if (!tickerRegistered) {
    gsap.ticker.add(onTickerUpdate)
    tickerRegistered = true
  }
}

export function teardownTicker(): void {
  if (tickerRegistered) {
    gsap.ticker.remove(onTickerUpdate)
    tickerRegistered = false
  }
}

// Global store object export for convenience
export const interactionStore = {
  state,
  setRawPointer,
  setPointerLeave,
  setActiveInteraction,
  registerInteractionDOMBindings,
  getInteractionState,
  subscribeToInteraction,
  teardownTicker,
}
