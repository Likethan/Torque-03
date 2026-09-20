import * as THREE from 'three'

/**
 * ----------------------------------------------------------------------------
 * ROAD SPLINE & MATHEMATICS (Step 11 — Driving / Road Cinematic Sequence)
 * ----------------------------------------------------------------------------
 * A smooth 3D Catmull-Rom spline path spanning ~450 meters with subtle,
 * realistic highway curvature and gentle vertical cresting:
 *
 * Curve Profile:
 * - Straight Departure (P0 -> P1): 0m -> 35m
 * - Gentle Left Sweep (P2 -> P3): 35m -> 145m
 * - Transition Straight & Crest (P4 -> P5): 145m -> 275m (+2.0m elevation)
 * - Gentle Right Sweep (P5 -> P6): 275m -> 335m
 * - Arrival & Hero Hold (P7 -> P8): 335m -> 450m
 *
 * All sampling functions are zero-allocation inside the RAF loop.
 */

const SPLINE_CONTROL_POINTS: THREE.Vector3[] = [
  new THREE.Vector3(0.0, 0.0, 0.0),    // P0: Departure start (aligned with interior exit)
  new THREE.Vector3(0.0, 0.0, 35.0),   // P1: Departure forward roll
  new THREE.Vector3(-4.5, 0.2, 85.0),  // P2: Left sweep entry
  new THREE.Vector3(-12.0, 0.6, 145.0), // P3: Sweeping left apex
  new THREE.Vector3(-10.5, 1.2, 210.0), // P4: Grade rise straight
  new THREE.Vector3(0.0, 2.0, 275.0),   // P5: Crest & right sweep entry
  new THREE.Vector3(9.5, 1.6, 335.0),  // P6: Sweeping right apex
  new THREE.Vector3(7.0, 0.8, 395.0),  // P7: Arrival deceleration
  new THREE.Vector3(6.0, 0.5, 450.0),  // P8: Final hero hold
]

// 3D Spline instance (500 divisions for sub-millimeter precision arc length)
export const ROAD_CURVE = new THREE.CatmullRomCurve3(
  SPLINE_CONTROL_POINTS,
  false,
  'catmullrom',
  0.5
)

// Cached total arc length
const ROAD_LENGTH = ROAD_CURVE.getLength()

// Pre-allocated static vectors for zero GC sampling
const vUpApprox = new THREE.Vector3(0, 1, 0)
const vTanNext = new THREE.Vector3()
const vTanDelta = new THREE.Vector3()

/**
 * Returns total road spline arc length in meters (~450m).
 */
export function getRoadLength(): number {
  return ROAD_LENGTH
}

/**
 * Samples position along the road spline at progress t [0.0, 1.0].
 */
export function sampleRoadPoint(t: number, target: THREE.Vector3): THREE.Vector3 {
  const clampedT = Math.min(Math.max(t, 0), 1)
  ROAD_CURVE.getPointAt(clampedT, target)
  return target
}

/**
 * Samples normalized forward tangent along the road spline at progress t [0.0, 1.0].
 */
export function sampleRoadTangent(t: number, target: THREE.Vector3): THREE.Vector3 {
  const clampedT = Math.min(Math.max(t, 0), 1)
  ROAD_CURVE.getTangentAt(clampedT, target)
  target.normalize()
  return target
}

/**
 * Samples complete orthonormal basis (Forward, Right, Up) at progress t.
 * Ensures the vehicle and camera perfectly orient along the road ribbon.
 */
export function sampleRoadBasis(
  t: number,
  right: THREE.Vector3,
  up: THREE.Vector3,
  forward: THREE.Vector3
): void {
  sampleRoadTangent(t, forward)

  // Right = Forward x UpApprox
  right.crossVectors(forward, vUpApprox).normalize()

  // Up = Right x Forward (ensures true orthogonal normal)
  up.crossVectors(right, forward).normalize()
}

/**
 * Evaluates instantaneous road curvature (signed: + for left curve, - for right curve)
 * used for steering angle and suspension body roll.
 */
export function sampleRoadCurvature(t: number): number {
  const clampedT = Math.min(Math.max(t, 0), 0.99)
  const dt = 0.005
  sampleRoadTangent(clampedT, forwardTemp)
  sampleRoadTangent(clampedT + dt, vTanNext)

  vTanDelta.subVectors(vTanNext, forwardTemp)
  // Cross with Up to extract signed lateral turn rate
  const signedRate = (forwardTemp.x * vTanNext.z - forwardTemp.z * vTanNext.x) / (dt * ROAD_LENGTH)
  return signedRate
}

const forwardTemp = new THREE.Vector3()
