import * as THREE from 'three'
import { clamp } from '../../motion/clamp'

/**
 * ----------------------------------------------------------------------------
 * AUTOMOTIVE STUDIO LIGHTING STATES (Step 7 — Dynamic Automotive Lighting)
 * ----------------------------------------------------------------------------
 * Photographed inside a dark automotive studio.
 *
 * Controlled 4-Light Rig:
 * 1. Key Light: High-angle directional softbox light illuminating top/shoulder/hood bevels.
 * 2. Rim Light: Cool titanium accent light separating the vehicle silhouette from background.
 * 3. Fill Light: Low-angle warm bounce controlling shadow darkness without pure-black crush.
 * 4. Ambient Baseline: Restrained slate tone for subtle overall radiance.
 *
 * 5 Reusable Cinematic Lighting States:
 * - STATE A: INTRO (0.00 – 0.18): Low-key moody silhouette, dim key, rim emphasis, headlights off.
 * - STATE B: FRONT REVEAL (0.18 – 0.42): Key pushes forward, headlight halogen awakening, grille glints.
 * - STATE C: SIDE PROFILE (0.42 – 0.68): Rim light peaks along shoulder line & roofline, balanced door fill.
 * - STATE D: TECHNICAL DETAIL (0.68 – 0.88): Controlled CAD inspection lighting, crisp specular bevels.
 * - STATE E: FULL VEHICLE (0.88 – 1.00): Balanced 3-point studio portrait, resting warm headlights, grounded stance.
 */

export interface StudioLightingState {
  id: string
  name: string
  // 1. Key Light (Primary Softbox)
  keyPosition: [number, number, number]
  keyColor: string
  keyIntensity: number

  // 2. Rim Light (Silhouette Separation)
  rimPosition: [number, number, number]
  rimColor: string
  rimIntensity: number

  // 3. Fill Light (Cavity & Ground Bounce)
  fillPosition: [number, number, number]
  fillColor: string
  fillIntensity: number

  // 4. Ambient Baseline
  ambientColor: string
  ambientIntensity: number

  // 5. Headlight Automotive Emissive
  headlightEmissiveIntensity: number
  headlightColor: string

  // 6. Ground Shadow Density
  groundShadowOpacity: number
}

export const LIGHTING_STATES: Record<string, StudioLightingState> = {
  INTRO: {
    id: 'INTRO',
    name: 'Atmospheric Studio Awakening',
    keyPosition: [5.0, 5.5, 3.0],
    keyColor: '#e8ecf2',
    keyIntensity: 0.75,
    rimPosition: [-5.0, 4.0, -3.5],
    rimColor: '#8ea0b5',
    rimIntensity: 1.25,
    fillPosition: [0.0, -1.8, 2.5],
    fillColor: '#d6cfc7',
    fillIntensity: 0.32,
    ambientColor: '#181b20',
    ambientIntensity: 0.45,
    headlightEmissiveIntensity: 0.0,
    headlightColor: '#ffe2b0',
    groundShadowOpacity: 0.75,
  },
  FRONT_REVEAL: {
    id: 'FRONT_REVEAL',
    name: 'Front-Quarter Wedge & Headlight Reveal',
    keyPosition: [3.4, 5.2, 4.8],
    keyColor: '#f5f6f8',
    keyIntensity: 1.65,
    rimPosition: [-4.2, 3.6, -2.8],
    rimColor: '#9bb2c8',
    rimIntensity: 0.95,
    fillPosition: [0.5, -1.6, 2.8],
    fillColor: '#ded8d0',
    fillIntensity: 0.42,
    ambientColor: '#1e2229',
    ambientIntensity: 0.58,
    headlightEmissiveIntensity: 0.85,
    headlightColor: '#fff2d4',
    groundShadowOpacity: 0.70,
  },
  SIDE_PROFILE: {
    id: 'SIDE_PROFILE',
    name: 'Aerodynamic Flank & Shoulder Line Glint',
    keyPosition: [4.2, 4.8, 2.2],
    keyColor: '#f2f4f8',
    keyIntensity: 1.45,
    rimPosition: [-5.2, 4.2, -3.8],
    rimColor: '#a6bcd2',
    rimIntensity: 1.40,
    fillPosition: [-0.5, -1.5, 2.2],
    fillColor: '#e0dad2',
    fillIntensity: 0.50,
    ambientColor: '#20242b',
    ambientIntensity: 0.62,
    headlightEmissiveIntensity: 0.25,
    headlightColor: '#ffe4b5',
    groundShadowOpacity: 0.68,
  },
  TECHNICAL_DETAIL: {
    id: 'TECHNICAL_DETAIL',
    name: 'CAD Engineering Inspection Rig',
    keyPosition: [2.5, 6.2, 3.2],
    keyColor: '#f8fafc',
    keyIntensity: 1.80,
    rimPosition: [-3.8, 3.2, -2.5],
    rimColor: '#90a4ba',
    rimIntensity: 1.05,
    fillPosition: [0.0, -2.0, 1.8],
    fillColor: '#e8e2da',
    fillIntensity: 0.55,
    ambientColor: '#222830',
    ambientIntensity: 0.68,
    headlightEmissiveIntensity: 0.15,
    headlightColor: '#ffe8c2',
    groundShadowOpacity: 0.65,
  },
  FULL_VEHICLE: {
    id: 'FULL_VEHICLE',
    name: 'Balanced 3-Point Studio Portrait',
    keyPosition: [4.5, 6.0, 3.5],
    keyColor: '#f5f6f8',
    keyIntensity: 1.85,
    rimPosition: [-4.5, 3.5, -3.0],
    rimColor: '#8ea0b5',
    rimIntensity: 1.05,
    fillPosition: [0.0, -1.8, 2.5],
    fillColor: '#e6dfd8',
    fillIntensity: 0.45,
    ambientColor: '#222831',
    ambientIntensity: 0.65,
    headlightEmissiveIntensity: 0.35,
    headlightColor: '#ffe6ba',
    groundShadowOpacity: 0.70,
  },
}

export interface RuntimeLightingValues {
  keyPos: THREE.Vector3
  keyColor: THREE.Color
  keyIntensity: number
  rimPos: THREE.Vector3
  rimColor: THREE.Color
  rimIntensity: number
  fillPos: THREE.Vector3
  fillColor: THREE.Color
  fillIntensity: number
  ambientColor: THREE.Color
  ambientIntensity: number
  headlightEmissive: number
  headlightColor: THREE.Color
  groundShadowOpacity: number
}

// Pre-allocated static vectors & colors to avoid GC during animation ticks
const vKeyA = new THREE.Vector3()
const vKeyB = new THREE.Vector3()
const vRimA = new THREE.Vector3()
const vRimB = new THREE.Vector3()
const vFillA = new THREE.Vector3()
const vFillB = new THREE.Vector3()

const cKeyA = new THREE.Color()
const cKeyB = new THREE.Color()
const cRimA = new THREE.Color()
const cRimB = new THREE.Color()
const cFillA = new THREE.Color()
const cFillB = new THREE.Color()
const cAmbA = new THREE.Color()
const cAmbB = new THREE.Color()
const cHlA = new THREE.Color()
const cHlB = new THREE.Color()

/**
 * Cubic smoothstep curve for weighted automotive lighting transitions.
 */
function smoothstep(t: number): number {
  const c = clamp(t, 0, 1)
  return c * c * (3 - 2 * c)
}

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Resolves the active lighting state pair and interpolation alpha for a given scroll progress.
 */
export function sampleStudioLightingState(progress: number): {
  stateA: StudioLightingState
  stateB: StudioLightingState
  alpha: number
} {
  const p = clamp(progress, 0, 1)

  // Stage 1: Intro -> Front Reveal (0.00 -> 0.25)
  if (p <= 0.25) {
    const t = p / 0.25
    return {
      stateA: LIGHTING_STATES.INTRO,
      stateB: LIGHTING_STATES.FRONT_REVEAL,
      alpha: smoothstep(t),
    }
  }

  // Stage 2: Front Reveal -> Side Profile (0.25 -> 0.50)
  if (p <= 0.50) {
    const t = (p - 0.25) / 0.25
    return {
      stateA: LIGHTING_STATES.FRONT_REVEAL,
      stateB: LIGHTING_STATES.SIDE_PROFILE,
      alpha: smoothstep(t),
    }
  }

  // Stage 3: Side Profile -> Technical CAD Detail (0.50 -> 0.75)
  if (p <= 0.75) {
    const t = (p - 0.50) / 0.25
    return {
      stateA: LIGHTING_STATES.SIDE_PROFILE,
      stateB: LIGHTING_STATES.TECHNICAL_DETAIL,
      alpha: smoothstep(t),
    }
  }

  // Stage 4: Technical Detail -> Full Vehicle Studio Synthesis (0.75 -> 1.00)
  const t = (p - 0.75) / 0.25
  return {
    stateA: LIGHTING_STATES.TECHNICAL_DETAIL,
    stateB: LIGHTING_STATES.FULL_VEHICLE,
    alpha: smoothstep(t),
  }
}

/**
 * Computes live interpolated studio lighting values, adding subtle pointer
 * parallax shift and velocity momentum without obvious cursor chasing.
 */
export function computeStudioLighting(
  progress: number,
  pointerNX: number,
  pointerNY: number,
  normalizedVelocity: number,
  target: RuntimeLightingValues
): void {
  const { stateA, stateB, alpha } = sampleStudioLightingState(progress)

  // 1. Key Light Position & Color
  vKeyA.set(...stateA.keyPosition)
  vKeyB.set(...stateB.keyPosition)
  target.keyPos.lerpVectors(vKeyA, vKeyB, alpha)

  // Subtle pointer influence on Key Light (max ±0.45m shift in 3D studio space, ~4° glint shift)
  const pointerOffsetX = pointerNX * 0.45
  const pointerOffsetY = -pointerNY * 0.35
  // Velocity inertia pushes highlight slightly forward along bodyline
  const velOffset = normalizedVelocity * 0.20
  target.keyPos.x += pointerOffsetX + velOffset
  target.keyPos.y += pointerOffsetY

  cKeyA.set(stateA.keyColor)
  cKeyB.set(stateB.keyColor)
  target.keyColor.copy(cKeyA).lerp(cKeyB, alpha)
  target.keyIntensity = lerpNum(stateA.keyIntensity, stateB.keyIntensity, alpha)

  // 2. Rim Light Position & Color (opposing flank)
  vRimA.set(...stateA.rimPosition)
  vRimB.set(...stateB.rimPosition)
  target.rimPos.lerpVectors(vRimA, vRimB, alpha)
  target.rimPos.x -= pointerOffsetX * 0.4 // Subtle counter-parallax on rim
  cRimA.set(stateA.rimColor)
  cRimB.set(stateB.rimColor)
  target.rimColor.copy(cRimA).lerp(cRimB, alpha)
  target.rimIntensity = lerpNum(stateA.rimIntensity, stateB.rimIntensity, alpha)

  // 3. Fill Light (Warm Ground Bounce)
  vFillA.set(...stateA.fillPosition)
  vFillB.set(...stateB.fillPosition)
  target.fillPos.lerpVectors(vFillA, vFillB, alpha)
  cFillA.set(stateA.fillColor)
  cFillB.set(stateB.fillColor)
  target.fillColor.copy(cFillA).lerp(cFillB, alpha)
  target.fillIntensity = lerpNum(stateA.fillIntensity, stateB.fillIntensity, alpha)

  // 4. Ambient Baseline
  cAmbA.set(stateA.ambientColor)
  cAmbB.set(stateB.ambientColor)
  target.ambientColor.copy(cAmbA).lerp(cAmbB, alpha)
  target.ambientIntensity = lerpNum(stateA.ambientIntensity, stateB.ambientIntensity, alpha)

  // 5. Headlight Automotive Emissive
  target.headlightEmissive = lerpNum(
    stateA.headlightEmissiveIntensity,
    stateB.headlightEmissiveIntensity,
    alpha
  )
  cHlA.set(stateA.headlightColor)
  cHlB.set(stateB.headlightColor)
  target.headlightColor.copy(cHlA).lerp(cHlB, alpha)

  // 6. Ground Shadow Opacity
  target.groundShadowOpacity = lerpNum(stateA.groundShadowOpacity, stateB.groundShadowOpacity, alpha)
}

/**
 * Creates an initialized RuntimeLightingValues container.
 */
export function createRuntimeLightingValues(): RuntimeLightingValues {
  return {
    keyPos: new THREE.Vector3(5.0, 5.5, 3.0),
    keyColor: new THREE.Color('#f5f6f8'),
    keyIntensity: 0.75,
    rimPos: new THREE.Vector3(-5.0, 4.0, -3.5),
    rimColor: new THREE.Color('#8ea0b5'),
    rimIntensity: 1.25,
    fillPos: new THREE.Vector3(0.0, -1.8, 2.5),
    fillColor: new THREE.Color('#d6cfc7'),
    fillIntensity: 0.32,
    ambientColor: new THREE.Color('#181b20'),
    ambientIntensity: 0.45,
    headlightEmissive: 0.0,
    headlightColor: new THREE.Color('#ffe2b0'),
    groundShadowOpacity: 0.75,
  }
}
