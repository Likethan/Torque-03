import * as THREE from 'three'
import type { RoadCameraShot, RoadChoreographyResult } from './roadTypes'
import {
  sampleRoadPoint,
  sampleRoadBasis,
} from './roadSpline'
import { clamp } from '../../motion/clamp'

/**
 * ----------------------------------------------------------------------------
 * ROAD CAMERA CHOREOGRAPHY (Step 11 — Driving / Road Cinematic Sequence)
 * ----------------------------------------------------------------------------
 * 8 directed cinematic camera shots defining the road driving journey.
 *
 * Each camera shot defines:
 * - offset: [right, up, forward] relative to vehicle's moving orthonormal basis
 * - targetOffset: [right, up, forward] look-at target relative to vehicle center
 * - fov: field-of-view angle for psychological cinematic framing
 * - pointerScale: subtle parallax responsiveness
 */

export const ROAD_CAMERA_SHOTS: RoadCameraShot[] = [
  {
    id: 'ROAD_DEPARTURE',
    phase: 'PH-01',
    title: 'COCKPIT DEPARTURE',
    subtitle: 'Looking forward through the windshield as momentum builds',
    range: { start: 0.0, end: 0.12 },
    offset: [-0.15, 1.14, 0.8],
    targetOffset: [0.0, 1.0, 12.0],
    fov: 42,
    pointerScale: 0.2,
    editorialTag: 'ENGINEERED FOR THE ROAD',
    description:
      'From within the cockpit, the vehicle initiates forward motion. The horizon expands through the acoustic windshield.',
  },
  {
    id: 'ROAD_REVEAL',
    phase: 'PH-02',
    title: 'EXTERIOR REVEAL',
    subtitle: 'Camera sweeps out to a low rear three-quarter tracking perspective',
    range: { start: 0.12, end: 0.24 },
    offset: [2.8, 1.35, -5.8],
    targetOffset: [0.0, 0.7, 0.5],
    fov: 38,
    pointerScale: 0.5,
    editorialTag: 'AERODYNAMIC SILHOUETTE',
    description:
      'The camera emerges from the cabin, revealing the tapered rear decklid, dual jewel taillights, and sculpted shoulder line in motion.',
  },
  {
    id: 'ROAD_MOMENTUM',
    phase: 'PH-03',
    title: 'HIGHWAY MOMENTUM',
    subtitle: 'Side profile tracking alongside the accelerating passenger flank',
    range: { start: 0.24, end: 0.38 },
    offset: [4.6, 1.15, -0.4],
    targetOffset: [0.0, 0.75, 0.2],
    fov: 36,
    pointerScale: 0.4,
    editorialTag: '3.0L V6 VTEC // 240 HP',
    description:
      'Parallel flank tracking as the vehicle accelerates along the curving highway. 16-inch 7-spoke alloy wheels spin smoothly against the asphalt.',
  },
  {
    id: 'ROAD_MACHINE',
    phase: 'PH-04',
    title: 'MECHANICAL GROUND CONTACT',
    subtitle: 'Low wheel-level perspective skimming the asphalt surface',
    range: { start: 0.38, end: 0.50 },
    offset: [-2.1, 0.42, 1.2],
    targetOffset: [-0.85, 0.32, 1.35],
    fov: 44,
    pointerScale: 0.25,
    editorialTag: 'DOUBLE WISHBONE SUSPENSION',
    description:
      'Asphalt-level inspection capturing the precision tire-to-road contact and hydroformed subframe poise through road undulations.',
  },
  {
    id: 'ROAD_ENVIRONMENT',
    phase: 'PH-05',
    title: 'CREST & ENVIRONMENT',
    subtitle: 'Wide cinematic panoramic view crossing the elevated highway crest',
    range: { start: 0.50, end: 0.66 },
    offset: [-6.8, 4.5, -12.5],
    targetOffset: [0.0, 0.8, 6.0],
    fov: 34,
    pointerScale: 0.7,
    editorialTag: 'BUILT TO MOVE',
    description:
      'Elevated panoramic composition framing the Satin Silver unibody against the rolling ridges and dusk atmospheric horizon.',
  },
  {
    id: 'ROAD_HERO',
    phase: 'PH-06',
    title: 'FRONT THREE-QUARTER HERO',
    subtitle: 'Dynamic tracking shot with headlights illuminating the twilight road',
    range: { start: 0.66, end: 0.80 },
    offset: [-3.2, 1.1, 6.2],
    targetOffset: [0.0, 0.8, -0.5],
    fov: 38,
    pointerScale: 0.45,
    editorialTag: 'ILLUMINATED PRECISION',
    description:
      'Front wedge perspective capturing the chrome pentagonal grille and twin halogen multi-reflector headlights cutting through the twilight.',
  },
  {
    id: 'ROAD_ARRIVAL',
    phase: 'PH-07',
    title: 'DECELERATION & ARRIVAL',
    subtitle: 'Camera glides ahead looking back as the vehicle decelerates',
    range: { start: 0.80, end: 0.92 },
    offset: [1.8, 1.4, 7.8],
    targetOffset: [0.0, 0.75, 0.0],
    fov: 36,
    pointerScale: 0.4,
    editorialTag: 'DECELERATION CONTROL',
    description:
      'Leading tracking perspective as the vehicle settles down from highway momentum, headlights reflecting softly off the asphalt.',
  },
  {
    id: 'ROAD_HOLD',
    phase: 'PH-08',
    title: 'HERO EQUILIBRIUM',
    subtitle: 'The vehicle settles into balanced twilight repose',
    range: { start: 0.92, end: 1.0 },
    offset: [-3.8, 1.5, 5.2],
    targetOffset: [0.0, 0.7, 0.0],
    fov: 36,
    pointerScale: 0.5,
    editorialTag: 'HERO EQUILIBRIUM // 2003 HONDA ACCORD',
    description:
      'The machine comes to rest in balanced twilight equilibrium. Pure automotive proportion and engineering presence.',
  },
]

// Pre-allocated static vectors for zero GC sampling
const vVehPos = new THREE.Vector3()
const vVehRight = new THREE.Vector3()
const vVehUp = new THREE.Vector3()
const vVehFwd = new THREE.Vector3()

const vInterpOffset = new THREE.Vector3()
const vInterpTargetOffset = new THREE.Vector3()

/**
 * Cubic smoothstep curve for weighted shot transitions.
 */
function smoothstep(t: number): number {
  const c = clamp(t, 0, 1)
  return c * c * (3 - 2 * c)
}

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Evaluates the road camera choreography at roadProgress [0.0, 1.0].
 * Computes world camera position and look-at target by applying the interpolated
 * local offset to the vehicle's dynamic orthonormal coordinate frame.
 */
export function sampleRoadChoreography(
  progress: number,
  outCamPos: THREE.Vector3,
  outCamTarget: THREE.Vector3,
  responsiveScale: number = 1.0
): RoadChoreographyResult {
  const p = clamp(progress, 0, 1)

  // 1. Locate active camera shot
  let shotIndex = 0
  for (let i = 0; i < ROAD_CAMERA_SHOTS.length; i++) {
    const shot = ROAD_CAMERA_SHOTS[i]
    if (p >= shot.range.start && p <= shot.range.end) {
      shotIndex = i
      break
    }
  }
  if (p >= 1.0) shotIndex = ROAD_CAMERA_SHOTS.length - 1

  const currentShot = ROAD_CAMERA_SHOTS[shotIndex]
  const nextShot =
    shotIndex < ROAD_CAMERA_SHOTS.length - 1
      ? ROAD_CAMERA_SHOTS[shotIndex + 1]
      : currentShot

  // 2. Compute normalized local progress within shot
  const rangeSpan = Math.max(currentShot.range.end - currentShot.range.start, 0.001)
  const localProg = (p - currentShot.range.start) / rangeSpan
  const t = smoothstep(localProg)

  // 3. Interpolate local vehicle-relative offsets
  const offAX = currentShot.offset[0] * responsiveScale
  const offAY = currentShot.offset[1]
  const offAZ = currentShot.offset[2] * responsiveScale

  const offBX = nextShot.offset[0] * responsiveScale
  const offBY = nextShot.offset[1]
  const offBZ = nextShot.offset[2] * responsiveScale

  vInterpOffset.set(
    lerpNum(offAX, offBX, t),
    lerpNum(offAY, offBY, t),
    lerpNum(offAZ, offBZ, t)
  )

  const tgtAX = currentShot.targetOffset[0]
  const tgtAY = currentShot.targetOffset[1]
  const tgtAZ = currentShot.targetOffset[2]

  const tgtBX = nextShot.targetOffset[0]
  const tgtBY = nextShot.targetOffset[1]
  const tgtBZ = nextShot.targetOffset[2]

  vInterpTargetOffset.set(
    lerpNum(tgtAX, tgtBX, t),
    lerpNum(tgtAY, tgtBY, t),
    lerpNum(tgtAZ, tgtBZ, t)
  )

  const interpolatedFov = lerpNum(currentShot.fov, nextShot.fov, t)
  const interpolatedPointerScale = lerpNum(
    currentShot.pointerScale,
    nextShot.pointerScale,
    t
  )

  // 4. Sample vehicle's world position and orthonormal basis along road spline
  sampleRoadPoint(p, vVehPos)
  sampleRoadBasis(p, vVehRight, vVehUp, vVehFwd)

  // 5. Transform local offsets into world coordinates:
  // WorldPos = VehiclePos + Right*x + Up*y + Forward*z
  outCamPos.copy(vVehPos)
    .addScaledVector(vVehRight, vInterpOffset.x)
    .addScaledVector(vVehUp, vInterpOffset.y)
    .addScaledVector(vVehFwd, vInterpOffset.z)

  outCamTarget.copy(vVehPos)
    .addScaledVector(vVehRight, vInterpTargetOffset.x)
    .addScaledVector(vVehUp, vInterpTargetOffset.y)
    .addScaledVector(vVehFwd, vInterpTargetOffset.z)

  return {
    activeShot: currentShot,
    nextShot: nextShot !== currentShot ? nextShot : undefined,
    localProgress: localProg,
    transitionProgress: t,
    fov: interpolatedFov,
    pointerScale: interpolatedPointerScale,
    editorialTag: currentShot.editorialTag,
  }
}
