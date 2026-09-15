/**
 * ----------------------------------------------------------------------------
 * MECHANICAL CONSTRAINTS (Step 16 — Mechanical Physics)
 * ----------------------------------------------------------------------------
 * Explicit physical boundary enforcement: angular hinge limits, linear
 * displacement limits, and mechanical clearance boundaries.
 */

import { normalizeAngleSigned } from './mechanicalMotion'

/**
 * Standard scalar clamp between min and max.
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max)
}

/**
 * Enforces angular hinge constraints.
 * Ensures a pivoted component (such as a valvetrain rocker arm) does not
 * travel beyond its mechanical journal stops.
 */
export function enforceHingeConstraint(
  angle: number,
  minAngle: number,
  maxAngle: number
): { angle: number; isClamped: boolean } {
  const signed = normalizeAngleSigned(angle)
  if (signed < minAngle) {
    return { angle: minAngle, isClamped: true }
  }
  if (signed > maxAngle) {
    return { angle: maxAngle, isClamped: true }
  }
  return { angle: signed, isClamped: false }
}

/**
 * Enforces linear stroke/travel constraint (e.g. valve lifter stroke limits).
 */
export function enforceLinearTravel(
  travel: number,
  minTravel: number,
  maxTravel: number
): { travel: number; isClamped: boolean } {
  if (travel < minTravel) {
    return { travel: minTravel, isClamped: true }
  }
  if (travel > maxTravel) {
    return { travel: maxTravel, isClamped: true }
  }
  return { travel, isClamped: false }
}

/**
 * Evaluates the overall constraint status of the valvetrain mechanism.
 */
export function evaluateMechanismStatus(
  valveTravelMeters: number,
  maxLiftMeters: number,
  rockerClamped: boolean,
  valveClamped: boolean
): 'OPTIMAL' | 'LIMIT_REACHED' | 'RESTRICTED' {
  if (rockerClamped || valveClamped) {
    return 'LIMIT_REACHED'
  }
  if (valveTravelMeters >= maxLiftMeters * 0.96) {
    return 'RESTRICTED'
  }
  return 'OPTIMAL'
}
