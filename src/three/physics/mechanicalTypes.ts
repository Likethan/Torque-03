/**
 * ----------------------------------------------------------------------------
 * MECHANICAL PHYSICS TYPES (Step 16 — Mechanical Physics)
 * ----------------------------------------------------------------------------
 * Type definitions for procedural automotive mechanical motion, kinematic
 * relations, constraints, hinge pivots, and exploded-view inspection states.
 */

export interface MechanicalState {
  position: number
  velocity: number
  target: number
  acceleration?: number
}

export interface AngularRelation {
  ratio: number
  phaseOffset: number
  direction: 1 | -1
}

export interface LinearRotationalRelation {
  stroke: number
  baseOffset: number
  phaseOffset: number
}

export interface MechanicalConstraint {
  min: number
  max: number
  isClamped: boolean
}

export interface ExplodedOffset {
  axis: 'X' | 'Y' | 'Z'
  nominal: number
  maxOffset: number
  currentOffset: number
}

export interface ValvetrainKinematics {
  camAngleRad: number
  camAngleDeg: number
  drivenGearAngleRad: number
  drivenGearAngleDeg: number
  gearRatio: number
  camLiftMeters: number
  camLiftMm: number
  rockerAngleRad: number
  rockerAngleDeg: number
  valveTravelMeters: number
  valveTravelMm: number
  explodedProgress: number
  coverElevationMeters: number
  capsElevationMeters: number
  gearSeparationMeters: number
  mechanicalVelocity: number
  constraintStatus: 'OPTIMAL' | 'LIMIT_REACHED' | 'RESTRICTED'
}
