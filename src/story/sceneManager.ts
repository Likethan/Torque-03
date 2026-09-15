/**
 * SCENE MANAGER & PROGRESS MAPPING ENGINE
 * STEP 10 — ADVANCED SCROLL STORYTELLING
 *
 * This module embodies the core mental model:
 *
 * SCROLL POSITION
 *       ↓
 * GLOBAL PROGRESS (0.000 → 1.000)
 *       ↓
 * SCENE RANGE (e.g. 0.44 → 0.68)
 *       ↓
 * LOCAL PROGRESS (0.000 → 1.000)
 *       ↓
 * TIMELINE / VISUAL STATE
 *       ↓
 * RENDER
 *
 * GLOBAL PROGRESS answers: "Where am I in the entire Accord journey?"
 * LOCAL PROGRESS answers:  "Where am I inside this specific engineering chapter?"
 */

import { mapRange } from '../motion/mapRange'
import { clamp } from '../motion/clamp'
import type { SceneDefinition, SceneId, StoryState } from './sceneTypes'

/**
 * The 5 Canonical Story Chapters of the 2003 Honda Accord Experience.
 * Paced intentionally to allow each engineering dimension room to breathe.
 */
export const SCENE_DEFINITIONS: SceneDefinition[] = [
  {
    id: 'arrival',
    chapter: 'CH-01',
    title: 'ARRIVAL & AWAKENING',
    subtitle: 'Atmospheric emergence and camera approach',
    start: 0.0,
    end: 0.22,
    description:
      'The Accord rests in darkness. As scroll advances, light sweeps the sculpted silhouette and the camera approaches the vehicle composition center.',
  },
  {
    id: 'form',
    chapter: 'CH-02',
    title: 'SCULPTED FORM',
    subtitle: '0.26 / 0.30 Cd wind-tunnel discipline & proportions',
    start: 0.22,
    end: 0.44,
    description:
      'Departure from traditional boxy sedans. European athletic proportions, 106.9-inch wheelbase, and aerodynamic wedge profile.',
  },
  {
    id: 'architecture',
    chapter: 'CH-03',
    title: 'MONOCOQUE CHASSIS',
    subtitle: 'High-rigidity unibody & double-wishbone geometry',
    start: 0.44,
    end: 0.68,
    description:
      'Laser-welded floorpan with 48% high-tensile steel, torsional rigidity elevated by 27%, and racing-derived double-wishbone suspension.',
  },
  {
    id: 'powertrain',
    chapter: 'CH-04',
    title: 'POWERTRAIN HEART',
    subtitle: '240 HP 3.0L V6 VTEC / 2.4L DOHC i-VTEC mechanics',
    start: 0.68,
    end: 0.88,
    description:
      'Variable Valve Timing and Lift Electronic Control, drive-by-wire throttle response, and 212 lb-ft torque delivered across an authoritative powerband.',
  },
  {
    id: 'conclusion',
    chapter: 'CH-05',
    title: 'SYNTHESIS & HORIZON',
    subtitle: 'Holistic engineering benchmark & archive handoff',
    start: 0.88,
    end: 1.0,
    description:
      'Every sub-system harmonizes into a unified engineering artifact, transitioning smoothly into the technical specifications archive.',
  },
]

/**
 * Maps global document or stage progress [0.0, 1.0] to a scene's local progress [0.0, 1.0].
 *
 * Example:
 * If Powertrain is defined as [0.68, 0.88]:
 * At global 0.78, local progress is precisely 0.50 (50% through the Powertrain chapter).
 *
 * Clamped strictly to [0.0, 1.0] so values outside the scene boundaries do not produce runaway state.
 */
export function calculateLocalProgress(
  globalProgress: number,
  start: number,
  end: number
): number {
  return mapRange(globalProgress, start, end, 0.0, 1.0, true)
}

/**
 * Resolves the complete StoryState at any given global progress.
 * Determines active scene, local progress, whether a crossfade transition is active,
 * and next scene context for continuous handoffs.
 */
export function getStoryState(
  globalProgress: number,
  velocity: number = 0,
  isPinned: boolean = false
): StoryState {
  const clampedGlobal = clamp(globalProgress, 0.0, 1.0)

  // Find the scene containing the current global progress
  let activeIndex = SCENE_DEFINITIONS.findIndex(
    (scene, idx) =>
      clampedGlobal >= scene.start &&
      (clampedGlobal < scene.end || idx === SCENE_DEFINITIONS.length - 1)
  )

  if (activeIndex === -1) {
    activeIndex = clampedGlobal <= 0 ? 0 : SCENE_DEFINITIONS.length - 1
  }

  const activeScene = SCENE_DEFINITIONS[activeIndex]
  const localProgress = calculateLocalProgress(
    clampedGlobal,
    activeScene.start,
    activeScene.end
  )

  // Transition detection: in the final 18% of a scene, calculate crossfade blending with the next chapter
  const transitionThreshold = 0.82
  const isTransitioning =
    localProgress >= transitionThreshold && activeIndex < SCENE_DEFINITIONS.length - 1

  const nextScene = isTransitioning ? SCENE_DEFINITIONS[activeIndex + 1] : undefined
  const transitionProgress = isTransitioning
    ? mapRange(localProgress, transitionThreshold, 1.0, 0.0, 1.0, true)
    : 0.0

  const direction =
    velocity > 0.001 ? 'DOWN' : velocity < -0.001 ? 'UP' : 'IDLE'

  return {
    globalProgress: clampedGlobal,
    activeScene,
    localProgress,
    isTransitioning,
    nextScene,
    transitionProgress,
    velocity,
    direction,
    isPinned,
  }
}

/**
 * Helper to retrieve a scene by identifier.
 */
export function getSceneById(id: SceneId): SceneDefinition | undefined {
  return SCENE_DEFINITIONS.find((s) => s.id === id)
}
