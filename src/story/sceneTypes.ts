/**
 * SCENE TYPES & ARCHITECTURE DEFINITIONS
 * STEP 10 — ADVANCED SCROLL STORYTELLING
 *
 * Core Mental Model:
 * SCROLL POSITION → GLOBAL PROGRESS → SCENE → LOCAL PROGRESS → VISUAL STATE
 */

export type SceneId = 'arrival' | 'form' | 'architecture' | 'powertrain' | 'conclusion'

export interface SceneDefinition {
  id: SceneId
  chapter: string
  title: string
  subtitle: string
  start: number // Normalized start bound within global progress [0.0, 1.0]
  end: number   // Normalized end bound within global progress [0.0, 1.0]
  description: string
}

export interface StoryState {
  globalProgress: number
  activeScene: SceneDefinition
  localProgress: number
  isTransitioning: boolean
  nextScene?: SceneDefinition
  transitionProgress: number
  velocity: number
  direction: 'DOWN' | 'UP' | 'IDLE'
  isPinned: boolean
}
