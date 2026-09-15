/**
 * INTERACTION MATHEMATICS UTILITY
 * STEP 12 — ADVANCED INTERACTION SYSTEM
 *
 * Mathematical foundation for continuous pointer and touch interaction:
 * 1. Viewport coordinate normalization ([-1, 1] relative to viewport center)
 * 2. Spike-clamped velocity and speed derivation
 * 3. Bounded proximity distance-strength modeling
 * 4. Magnetic displacement vectors
 * 5. Stable spring physics step for drag inertia and magnetic returns
 */

import { clamp } from '../motion/clamp'

export interface Point2D {
  x: number
  y: number
}

/**
 * Normalizes viewport pixel coordinates to [-1, 1] domain.
 * (0, 0) represents the exact optical center of the viewport.
 * (-1, -1) represents top-left; (+1, +1) represents bottom-right.
 */
export function normalizePointer(
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number
): { nx: number; ny: number } {
  if (viewportWidth <= 0 || viewportHeight <= 0) return { nx: 0, ny: 0 }
  const halfW = viewportWidth * 0.5
  const halfH = viewportHeight * 0.5

  const nx = clamp((x - halfW) / halfW, -1.0, 1.0)
  const ny = clamp((y - halfH) / halfH, -1.0, 1.0)

  return { nx, ny }
}

/**
 * Calculates Euclidean distance between two 2D points.
 */
export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculates velocity (pixels / millisecond) with spike clamping.
 * Prevents teleportation glitches from sudden cursor entry or unfocused windows.
 */
export function calculateVelocity(
  current: number,
  previous: number,
  dt: number,
  maxVelocity: number = 5.0
): number {
  if (dt <= 0.0001) return 0
  const rawVel = (current - previous) / dt
  return clamp(rawVel, -maxVelocity, maxVelocity)
}

/**
 * Proximity Distance-Strength Modeling
 * Translates distance to a normalized strength factor [0.0, 1.0].
 *
 * At distance = 0        -> strength = 1.0 (maximum interaction)
 * At distance >= radius   -> strength = 0.0 (no interaction)
 */
export function getProximityStrength(
  distance: number,
  radius: number,
  power: number = 1.2
): number {
  if (radius <= 0 || distance >= radius) return 0.0
  const normalized = 1.0 - distance / radius
  return Math.pow(clamp(normalized, 0.0, 1.0), power)
}

/**
 * Magnetic Displacement Vector Calculation
 * Computes how much an element should be drawn toward the cursor.
 *
 * @param pointer Current cursor position {x, y}
 * @param center Target element center {x, y}
 * @param radius Magnetic attraction threshold radius in pixels
 * @param factor Attraction stiffness factor (default: 0.32)
 * @param maxOffset Maximum displacement ceiling in pixels (default: 18px)
 */
export function calculateMagneticDisplacement(
  pointer: Point2D,
  center: Point2D,
  radius: number = 85,
  factor: number = 0.32,
  maxOffset: number = 18
): { mx: number; my: number; strength: number } {
  const dist = calculateDistance(pointer.x, pointer.y, center.x, center.y)
  const strength = getProximityStrength(dist, radius)

  if (strength <= 0.0001) {
    return { mx: 0, my: 0, strength: 0 }
  }

  const dx = pointer.x - center.x
  const dy = pointer.y - center.y

  const mx = clamp(dx * strength * factor, -maxOffset, maxOffset)
  const my = clamp(dy * strength * factor, -maxOffset, maxOffset)

  return { mx, my, strength }
}

/**
 * Semi-Implicit Euler Spring Integration Step
 * Simple, unconditionally stable spring physics for drag momentum and spring settling.
 *
 * F = -stiffness * (position - target) - damping * velocity
 */
export function springStep(
  position: number,
  target: number,
  velocity: number,
  stiffness: number = 120,
  damping: number = 14,
  dt: number = 0.016
): { position: number; velocity: number } {
  const clampedDt = Math.min(dt, 0.05) // prevent integration explosion on dropped frames
  const displacement = position - target
  const springForce = -stiffness * displacement
  const dampingForce = -damping * velocity
  const acceleration = springForce + dampingForce

  const newVelocity = velocity + acceleration * clampedDt
  const newPosition = position + newVelocity * clampedDt

  return { position: newPosition, velocity: newVelocity }
}
