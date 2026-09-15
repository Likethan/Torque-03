/**
 * ----------------------------------------------------------------------------
 * MECHANICAL RELATIONS (Step 16 — Mechanical Physics)
 * ----------------------------------------------------------------------------
 * Kinematic relationships between connected components:
 * - Gear ratios and angular counter-rotation
 * - Cam lobe eccentric profiles and harmonic lift
 * - Rocker arm hinge pivot angular deflections
 * - Linear valve follower reciprocation
 * - Controlled exploded-view inspection disassembly and reassembly
 */

import { radToDeg, normalizeAngle } from './mechanicalMotion'
import { enforceHingeConstraint, enforceLinearTravel, evaluateMechanismStatus } from './mechanicalConstraints'
import type { ValvetrainKinematics } from './mechanicalTypes'

// 2003 Honda Accord VTEC valvetrain parameters (scaled for 3D stage clarity)
export const GEAR_RATIO = -2.0              // Driven gear counter-rotates at 2x velocity (or 1:2 ratio)
export const MAX_VALVE_LIFT_METERS = 0.055  // Scaled 11.2mm automotive lift for visual clarity
export const ROCKER_ARM_RADIUS = 0.28       // Distance from rocker pivot shaft to cam roller
export const MAX_ROCKER_ANGLE_RAD = 0.22    // ~12.6 degrees max rocker angular tilt
export const MIN_ROCKER_ANGLE_RAD = -0.04   // Preload clearance

/**
 * Computes counter-rotating driven gear angle from input drive shaft angle.
 *
 * Relationship:
 *   theta_driven = - (theta_input * ratio) + phaseOffset
 */
export function computeGearAngle(
  inputAngle: number,
  ratio = GEAR_RATIO,
  phaseOffset = 0
): number {
  return -(inputAngle * Math.abs(ratio)) + phaseOffset
}

/**
 * Computes instantaneous cam lift from camshaft rotation angle.
 * Employs a cosine harmonic cam rise profile with base dwell.
 *
 * @param camAngle Angle of camshaft in radians
 * @param maxLift Maximum valve lift in meters
 * @param phaseOffset Phase angle of specific cylinder/lobe in radians
 */
export function computeCamLift(
  camAngle: number,
  maxLift = MAX_VALVE_LIFT_METERS,
  phaseOffset = 0
): number {
  const normAngle = normalizeAngle(camAngle + phaseOffset)
  // Active lobe lift occurs over 180 degrees (π radians)
  if (normAngle <= Math.PI) {
    // Harmonic rise and fall
    const lift = maxLift * 0.5 * (1 - Math.cos(normAngle * 2))
    return Math.max(0, lift)
  }
  // Base circle dwell (zero valve lift)
  return 0
}

/**
 * Computes rocker arm angular deflection around its pivot shaft axis.
 * Translates linear cam lobe contact height into angular hinge rotation.
 */
export function computeRockerAngle(
  camLift: number,
  armRadius = ROCKER_ARM_RADIUS
): { angle: number; isClamped: boolean } {
  // Angular displacement: theta ≈ lift / radius
  const nominalAngle = (camLift / armRadius) * 0.95
  return enforceHingeConstraint(nominalAngle, MIN_ROCKER_ANGLE_RAD, MAX_ROCKER_ANGLE_RAD)
}

/**
 * Computes linear valve stem stroke travel from cam lift.
 * Translates rocker arm tip contact into downward linear stem displacement.
 */
export function computeValveTravel(
  camLift: number,
  maxLift = MAX_VALVE_LIFT_METERS
): { travel: number; isClamped: boolean } {
  return enforceLinearTravel(camLift, 0, maxLift)
}

/**
 * Computes exploded-view inspection progress from global scroll progress.
 *
 * Mapping:
 * - 0.00 → 0.46 (Arrival, Approach, Form): Assembled (0.0)
 * - 0.46 → 0.72 (Architecture, Powertrain): Smoothly expands to Exploded Inspection (1.0)
 * - 0.72 → 0.85 (Mechanical): Holds at peak inspection clarity (1.0)
 * - 0.85 → 0.95 (Reconstruction): Smoothly reseats back to Assembled (0.0)
 * - 0.95 → 1.00 (Final): Fully Assembled at resting factory equilibrium (0.0)
 */
export function computeExplodedProgress(globalProgress: number): number {
  const p = Math.min(Math.max(globalProgress, 0), 1)

  // 1. Initial Assembled Stage
  if (p <= 0.46) {
    return 0
  }

  // 2. Disassembly Expansion (0.46 → 0.72)
  if (p > 0.46 && p <= 0.72) {
    const t = (p - 0.46) / (0.72 - 0.46)
    // Smooth cubic S-curve
    return t * t * (3 - 2 * t)
  }

  // 3. Peak Inspection Hold (0.72 → 0.85)
  if (p > 0.72 && p <= 0.85) {
    return 1.0
  }

  // 4. Reconstruction Reseating (0.85 → 0.95)
  if (p > 0.85 && p <= 0.95) {
    const t = (p - 0.85) / (0.95 - 0.85)
    // Invert smoothstep back to 0.0
    return 1.0 - (t * t * (3 - 2 * t))
  }

  // 5. Final Assembled Equilibrium (0.95 → 1.00)
  return 0
}

/**
 * Pre-allocated singleton kinematics container to prevent GC garbage collection in useFrame.
 */
const kinematicsSnapshot: ValvetrainKinematics = {
  camAngleRad: 0,
  camAngleDeg: 0,
  drivenGearAngleRad: 0,
  drivenGearAngleDeg: 0,
  gearRatio: GEAR_RATIO,
  camLiftMeters: 0,
  camLiftMm: 0,
  rockerAngleRad: 0,
  rockerAngleDeg: 0,
  valveTravelMeters: 0,
  valveTravelMm: 0,
  explodedProgress: 0,
  coverElevationMeters: 0,
  capsElevationMeters: 0,
  gearSeparationMeters: 0,
  mechanicalVelocity: 0,
  constraintStatus: 'OPTIMAL',
}

/**
 * Computes unified valvetrain kinematics snapshot for a frame.
 */
export function calculateValvetrainKinematics(
  camAngleRad: number,
  globalProgress: number,
  velocity = 0
): ValvetrainKinematics {
  const normCamAngle = normalizeAngle(camAngleRad)
  const drivenAngle = computeGearAngle(normCamAngle, GEAR_RATIO)
  const camLift = computeCamLift(normCamAngle, MAX_VALVE_LIFT_METERS)
  const rocker = computeRockerAngle(camLift)
  const valve = computeValveTravel(camLift)
  const explodedProg = computeExplodedProgress(globalProgress)

  // Disassembly offsets along deliberate mechanical axes
  const coverElevation = explodedProg * 0.26        // Upper valve cover lifts +0.26m Y
  const capsElevation = explodedProg * 0.12         // Cam journal caps lift +0.12m Y
  const gearSeparation = explodedProg * -0.08       // Secondary gear reveals clearance -0.08m X

  kinematicsSnapshot.camAngleRad = normCamAngle
  kinematicsSnapshot.camAngleDeg = radToDeg(normCamAngle)
  kinematicsSnapshot.drivenGearAngleRad = drivenAngle
  kinematicsSnapshot.drivenGearAngleDeg = radToDeg(drivenAngle)
  kinematicsSnapshot.gearRatio = GEAR_RATIO
  kinematicsSnapshot.camLiftMeters = camLift
  kinematicsSnapshot.camLiftMm = (camLift / MAX_VALVE_LIFT_METERS) * 11.2 // Scaled real mm
  kinematicsSnapshot.rockerAngleRad = rocker.angle
  kinematicsSnapshot.rockerAngleDeg = radToDeg(rocker.angle)
  kinematicsSnapshot.valveTravelMeters = valve.travel
  kinematicsSnapshot.valveTravelMm = (valve.travel / MAX_VALVE_LIFT_METERS) * 11.2
  kinematicsSnapshot.explodedProgress = explodedProg
  kinematicsSnapshot.coverElevationMeters = coverElevation
  kinematicsSnapshot.capsElevationMeters = capsElevation
  kinematicsSnapshot.gearSeparationMeters = gearSeparation
  kinematicsSnapshot.mechanicalVelocity = velocity
  kinematicsSnapshot.constraintStatus = evaluateMechanismStatus(
    valve.travel,
    MAX_VALVE_LIFT_METERS,
    rocker.isClamped,
    valve.isClamped
  )

  return kinematicsSnapshot
}
