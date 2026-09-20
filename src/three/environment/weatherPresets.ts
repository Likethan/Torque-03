import * as THREE from 'three'
import type {
  WeatherStateId,
  WeatherPresetConfig,
  EnvironmentState,
} from './environmentTypes'
import { clamp } from '../../motion/clamp'

/**
 * ----------------------------------------------------------------------------
 * AUTHORED WEATHER PRESETS (Step 12 — Environmental Interaction & Weather)
 * ----------------------------------------------------------------------------
 * 5 calibrated cinematic states designed to evolve naturally with the
 * 2003 Honda Accord road sequence:
 *
 * 1. CLEAR (0.00 – 0.20): Crisp late afternoon sun, dry road, high visibility
 * 2. OVERCAST (0.20 – 0.40): Golden-hour cloud deck, warm rim highlights
 * 3. MIST (0.40 – 0.60): Mountain road mist, elevated depth fog, damp asphalt
 * 4. RAIN (0.60 – 0.82): Cinematic rain streaks, glossy reflective road
 * 5. BLUE_HOUR (0.82 – 1.00): Deep cobalt twilight, damp road, resting equilibrium
 */

export const WEATHER_PRESETS: Record<WeatherStateId, WeatherPresetConfig> = {
  CLEAR: {
    id: 'CLEAR',
    name: 'Clear Afternoon',
    timeOfDay: 'LATE_AFTERNOON',
    rainIntensity: 0.0,
    roadWetness: 0.0,
    fogIntensity: 0.012,
    fogColor: '#1a202c',
    windIntensity: 0.15,
    sunElevationDeg: 28,
    keyColor: '#f5f6f8',
    keyIntensity: 1.65,
    ambientColor: '#181c22',
    skyHorizonColor: '#2e3848',
    skyZenithColor: '#10141a',
    description: 'Crisp late afternoon sun. Dry asphalt with maximum visibility.',
  },
  OVERCAST: {
    id: 'OVERCAST',
    name: 'Golden Overcast',
    timeOfDay: 'GOLDEN_HOUR',
    rainIntensity: 0.0,
    roadWetness: 0.06,
    fogIntensity: 0.018,
    fogColor: '#24222a',
    windIntensity: 0.32,
    sunElevationDeg: 16,
    keyColor: '#ffdda8',
    keyIntensity: 1.50,
    ambientColor: '#1e2028',
    skyHorizonColor: '#453835',
    skyZenithColor: '#141620',
    description: 'High cloud deck with golden-hour warmth. Elongated vehicle shadows.',
  },
  MIST: {
    id: 'MIST',
    name: 'Mountain Mist',
    timeOfDay: 'DUSK',
    rainIntensity: 0.10,
    roadWetness: 0.28,
    fogIntensity: 0.032,
    fogColor: '#1e1e26',
    windIntensity: 0.45,
    sunElevationDeg: 6,
    keyColor: '#d8c2b0',
    keyIntensity: 1.20,
    ambientColor: '#161922',
    skyHorizonColor: '#2c2834',
    skyZenithColor: '#0d1017',
    description: 'Mountain road mist descends. Horizon narrows as twilight approaches.',
  },
  RAIN: {
    id: 'RAIN',
    name: 'Cinematic Rain',
    timeOfDay: 'BLUE_HOUR',
    rainIntensity: 0.38,
    roadWetness: 0.72,
    fogIntensity: 0.026,
    fogColor: '#101622',
    windIntensity: 0.58,
    sunElevationDeg: -2,
    keyColor: '#8fa8c8',
    keyIntensity: 0.95,
    ambientColor: '#0f141d',
    skyHorizonColor: '#152236',
    skyZenithColor: '#080c14',
    description: 'Cinematic rain streaks across the highway. Glossy asphalt reflects vehicle headlights.',
  },
  BLUE_HOUR: {
    id: 'BLUE_HOUR',
    name: 'Blue Hour Repose',
    timeOfDay: 'BLUE_HOUR',
    rainIntensity: 0.14,
    roadWetness: 0.85,
    fogIntensity: 0.022,
    fogColor: '#0b1019',
    windIntensity: 0.25,
    sunElevationDeg: -8,
    keyColor: '#7088a8',
    keyIntensity: 0.85,
    ambientColor: '#0c1017',
    skyHorizonColor: '#0f1a2a',
    skyZenithColor: '#060810',
    description: 'Deep blue hour serenity. The machine settles into resting twilight equilibrium.',
  },
}

// Ordered stages along the road progress axis [0.0, 1.0]
const PRESET_STAGES: { threshold: number; preset: WeatherPresetConfig }[] = [
  { threshold: 0.00, preset: WEATHER_PRESETS.CLEAR },
  { threshold: 0.20, preset: WEATHER_PRESETS.OVERCAST },
  { threshold: 0.45, preset: WEATHER_PRESETS.MIST },
  { threshold: 0.70, preset: WEATHER_PRESETS.RAIN },
  { threshold: 0.90, preset: WEATHER_PRESETS.BLUE_HOUR },
]

// Pre-allocated static colors for zero GC interpolation
const cFogA = new THREE.Color()
const cFogB = new THREE.Color()
const cKeyA = new THREE.Color()
const cKeyB = new THREE.Color()
const cAmbA = new THREE.Color()
const cAmbB = new THREE.Color()
const cSkyHA = new THREE.Color()
const cSkyHB = new THREE.Color()
const cSkyZA = new THREE.Color()
const cSkyZB = new THREE.Color()

const cInterp = new THREE.Color()

function smoothstep(t: number): number {
  const c = clamp(t, 0, 1)
  return c * c * (3 - 2 * c)
}

function lerpNum(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Creates an initialized EnvironmentState container.
 */
export function createDefaultEnvironmentState(): EnvironmentState {
  return {
    weatherState: 'CLEAR',
    timeOfDay: 'LATE_AFTERNOON',
    rainIntensity: 0,
    roadWetness: 0,
    fogIntensity: 0.012,
    fogColor: '#1a202c',
    windIntensity: 0.15,
    sunElevationDeg: 28,
    keyColor: '#f5f6f8',
    keyIntensity: 1.65,
    ambientColor: '#181c22',
    skyHorizonColor: '#2e3848',
    skyZenithColor: '#10141a',
  }
}

/**
 * Evaluates live continuous environment state at a given road progress [0.0, 1.0].
 * Uses Hermite smoothstep interpolation across the authored weather stages.
 */
export function sampleEnvironmentState(
  progress: number,
  target: EnvironmentState
): void {
  const p = clamp(progress, 0, 1)

  // Find active preset stage interval
  let stageIdx = 0
  for (let i = 0; i < PRESET_STAGES.length - 1; i++) {
    if (p >= PRESET_STAGES[i].threshold && p <= PRESET_STAGES[i + 1].threshold) {
      stageIdx = i
      break
    }
  }
  if (p >= PRESET_STAGES[PRESET_STAGES.length - 1].threshold) {
    stageIdx = PRESET_STAGES.length - 2
  }

  const stageA = PRESET_STAGES[stageIdx]
  const stageB = PRESET_STAGES[stageIdx + 1]

  const span = Math.max(stageB.threshold - stageA.threshold, 0.001)
  const localProg = (p - stageA.threshold) / span
  const t = smoothstep(localProg)

  const cfgA = stageA.preset
  const cfgB = stageB.preset

  // Discrete state mapping based on dominance
  target.weatherState = t > 0.5 ? cfgB.id : cfgA.id
  target.timeOfDay = t > 0.5 ? cfgB.timeOfDay : cfgA.timeOfDay

  // Continuous numeric parameters
  target.rainIntensity = lerpNum(cfgA.rainIntensity, cfgB.rainIntensity, t)
  target.roadWetness = lerpNum(cfgA.roadWetness, cfgB.roadWetness, t)
  target.fogIntensity = lerpNum(cfgA.fogIntensity, cfgB.fogIntensity, t)
  target.windIntensity = lerpNum(cfgA.windIntensity, cfgB.windIntensity, t)
  target.sunElevationDeg = lerpNum(cfgA.sunElevationDeg, cfgB.sunElevationDeg, t)
  target.keyIntensity = lerpNum(cfgA.keyIntensity, cfgB.keyIntensity, t)

  // Color interpolations
  cFogA.set(cfgA.fogColor)
  cFogB.set(cfgB.fogColor)
  cInterp.copy(cFogA).lerp(cFogB, t)
  target.fogColor = '#' + cInterp.getHexString()

  cKeyA.set(cfgA.keyColor)
  cKeyB.set(cfgB.keyColor)
  cInterp.copy(cKeyA).lerp(cKeyB, t)
  target.keyColor = '#' + cInterp.getHexString()

  cAmbA.set(cfgA.ambientColor)
  cAmbB.set(cfgB.ambientColor)
  cInterp.copy(cAmbA).lerp(cAmbB, t)
  target.ambientColor = '#' + cInterp.getHexString()

  cSkyHA.set(cfgA.skyHorizonColor)
  cSkyHB.set(cfgB.skyHorizonColor)
  cInterp.copy(cSkyHA).lerp(cSkyHB, t)
  target.skyHorizonColor = '#' + cInterp.getHexString()

  cSkyZA.set(cfgA.skyZenithColor)
  cSkyZB.set(cfgB.skyZenithColor)
  cInterp.copy(cSkyZA).lerp(cSkyZB, t)
  target.skyZenithColor = '#' + cInterp.getHexString()
}
