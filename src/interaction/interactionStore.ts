/**
 * CENTRALIZED INTERACTION STORE
 * STEP 6 — ADVANCED CURSOR & MAGNETIC INTERACTION
 *
 * High-frequency mutable store operating entirely outside React's render cycle.
 * Synchronizes with GSAP's precision ticker (single unified RAF loop).
 *
 * Architecture:
 * Window Pointer Events -> Target Values -> Unified RAF -> Smoothed Values -> Visual Output
 */

import gsap from 'gsap'
import { dampDt } from '../motion/lerp'
import { normalizePointer, calculateVelocity } from './interactionMath'
import { setPointerMotion } from '../motion/unifiedMotion'

export type CursorMode = 'DEFAULT' | 'LINK' | 'MAGNETIC' | 'VIEW' | 'EXPLORE' | 'SCRUB'

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
  cursorMode: CursorMode
  cursorLabel: string
  followerX: number
  followerY: number
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
  pointerX: typeof window !== 'undefined' ? window.innerWidth * 0.5 : 0,
  pointerY: typeof window !== 'undefined' ? window.innerHeight * 0.5 : 0,
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
  cursorMode: 'DEFAULT',
  cursorLabel: '',
  followerX: typeof window !== 'undefined' ? window.innerWidth * 0.5 : 0,
  followerY: typeof window !== 'undefined' ? window.innerHeight * 0.5 : 0,
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
  state.cursorMode = 'DEFAULT'
  state.cursorLabel = ''
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
 * Updates contextual cursor mode and optional label.
 */
export function setCursorMode(mode: CursorMode, label: string = ''): void {
  state.cursorMode = mode
  state.cursorLabel = label
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
 * Damps normalized values with delta-time awareness, decays velocity, and feeds authoritative Unified Motion.
 */
function onTickerUpdate(_time: number, deltaTime: number): void {
  const dt = Math.min(Math.max(deltaTime * 0.001, 0.001), 0.1)

  // Smooth normalized coordinates with dt-aware damping
  state.smoothedNX = dampDt(state.smoothedNX, state.normalizedX, 8.0, dt)
  state.smoothedNY = dampDt(state.smoothedNY, state.normalizedY, 8.0, dt)

  // Smoothly damp the secondary trailing cursor follower
  // Creates weighted inertia during rapid movement and settles to zero separation when stopped
  state.followerX = dampDt(state.followerX, state.pointerX, 14.0, dt)
  state.followerY = dampDt(state.followerY, state.pointerY, 14.0, dt)

  // Velocity decay when pointer stops moving
  const now = performance.now()
  if (now - lastMoveTime > 40) {
    state.velocityX = dampDt(state.velocityX, 0, 7.5, dt)
    state.velocityY = dampDt(state.velocityY, 0, 7.5, dt)
    state.speed = dampDt(state.speed, 0, 7.5, dt)
  }

  // Authoritative write to Unified Motion State (One source of truth)
  setPointerMotion(
    state.pointerX,
    state.pointerY,
    state.smoothedNX,
    state.smoothedNY,
    state.speed * 1000, // px/s
    state.touchMode,
    state.isPointerInside
  )

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
  setCursorMode,
  registerInteractionDOMBindings,
  getInteractionState,
  subscribeToInteraction,
  teardownTicker,
}
