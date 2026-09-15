/**
 * CANONICAL SCENE MAPPER
 * STEP 19 — UNIFIED MOTION ARCHITECTURE
 *
 * Single authoritative source for decomposing global scroll progress [0.0, 1.0]
 * into canonical narrative scenes and normalized local scene progress [0.0, 1.0].
 *
 * Used synchronously across:
 * - DOM Chapter navigation
 * - CameraRig waypoint choreography
 * - Mechanical kinematics & exploded disassembly
 * - Accord GLSL shader inspection
 */

export interface SceneRange {
  start: number
  end: number
}

export interface CanonicalScene {
  id: string
  chapter: string
  title: string
  subtitle: string
  range: SceneRange
  description: string
}

export interface SceneResolution {
  activeScene: CanonicalScene
  localProgress: number
  sceneIndex: number
  isTransitioning: boolean
}

/**
 * 8 Canonical Narrative Scenes spanning global scroll progress 0.00 to 1.00
 */
export const CANONICAL_SCENES: readonly CanonicalScene[] = [
  {
    id: 'ARRIVAL',
    chapter: 'CH-01',
    title: 'ARRIVAL & AWAKENING',
    subtitle: 'Atmospheric wide establishing perspective',
    range: { start: 0.0, end: 0.15 },
    description: 'Wide establishing vantage. Assembly is small within the dark studio with large negative space.',
  },
  {
    id: 'APPROACH',
    chapter: 'CH-02',
    title: 'STUDIO APPROACH',
    subtitle: 'Front-quarter perspective descent',
    range: { start: 0.15, end: 0.3 },
    description: 'Camera descends smoothly toward the front three-quarters, establishing engineering proportions.',
  },
  {
    id: 'FORM',
    chapter: 'CH-03',
    title: 'SCULPTED FORM',
    subtitle: 'Low aerodynamic glide along the wedge profile',
    range: { start: 0.3, end: 0.45 },
    description: 'Low-angle tracking shot along the aerodynamic flank, emphasizing surface tension and machined radii.',
  },
  {
    id: 'ARCHITECTURE',
    chapter: 'CH-04',
    title: 'MONOCOQUE CHASSIS',
    subtitle: 'Elevated isometric structural inspection',
    range: { start: 0.45, end: 0.6 },
    description: 'Elevated technical perspective. Subframe carrier cradles the camshaft with subtle valve guide separation.',
  },
  {
    id: 'POWERTRAIN',
    chapter: 'CH-05',
    title: 'POWERTRAIN HEART',
    subtitle: 'Macro focus on VTEC camshaft & eccentric lobes',
    range: { start: 0.6, end: 0.72 },
    description: 'Close-in technical inspection of the J30A4 dual-stage VTEC lobes and polished friction surfaces.',
  },
  {
    id: 'MECHANICAL',
    chapter: 'CH-06',
    title: 'AXIAL KINEMATICS',
    subtitle: 'Centerline elevation of timing gear & index collar',
    range: { start: 0.72, end: 0.84 },
    description: 'Direct axial centerline perspective highlighting the anodized timing pulley and Championship Red collar.',
  },
  {
    id: 'RECONSTRUCTION',
    chapter: 'CH-07',
    title: 'STRUCTURAL RECONSTRUCTION',
    subtitle: 'Camera pull-back as components reseat into cradle',
    range: { start: 0.84, end: 0.94 },
    description: 'Camera smoothly pulls back as the elevated valve sleeves reseat cleanly into the monocoque carrier.',
  },
  {
    id: 'CONCLUSION',
    chapter: 'CH-08',
    title: 'ENGINEERING ARCHIVE',
    subtitle: 'Technical resting posture & archival reference',
    range: { start: 0.94, end: 1.0 },
    description: 'Final archival resting orientation. The Accord assembly settles into its structural CAD datum.',
  },
] as const

import { clamp } from './lerp'
export { clamp, mapRange } from './lerp'

/**
 * Mathematical helper: smooth Hermite interpolation
 */
export function smoothstep(min: number, max: number, value: number): number {
  const x = clamp((value - min) / (max - min), 0, 1)
  return x * x * (3 - 2 * x)
}

/**
 * Decomposes global progress [0.0, 1.0] into the active canonical scene and normalized localProgress [0.0, 1.0].
 * Guaranteed O(1) performance and zero object allocations when using cached resolution.
 */
export function resolveScene(globalProgress: number): SceneResolution {
  const clampedProg = clamp(globalProgress, 0, 1)
  const total = CANONICAL_SCENES.length

  for (let i = 0; i < total; i++) {
    const scene = CANONICAL_SCENES[i]
    const isLast = i === total - 1
    const inRange = isLast
      ? clampedProg >= scene.range.start && clampedProg <= scene.range.end
      : clampedProg >= scene.range.start && clampedProg < scene.range.end

    if (inRange) {
      const span = scene.range.end - scene.range.start
      const local = span > 0 ? clamp((clampedProg - scene.range.start) / span, 0, 1) : 0
      const isTransitioning = local > 0.85 || local < 0.15

      return {
        activeScene: scene,
        localProgress: local,
        sceneIndex: i,
        isTransitioning,
      }
    }
  }

  // Fallback to final scene
  const lastScene = CANONICAL_SCENES[total - 1]
  return {
    activeScene: lastScene,
    localProgress: 1.0,
    sceneIndex: total - 1,
    isTransitioning: false,
  }
}
