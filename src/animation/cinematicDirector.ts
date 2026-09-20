import { useSyncExternalStore } from 'react'
import { clamp } from '../motion/clamp'
import { mapRange } from '../motion/mapRange'

/**
 * ----------------------------------------------------------------------------
 * MASTER CINEMATIC DIRECTOR (Step 14 — Master Experience State)
 * ----------------------------------------------------------------------------
 * The centralized orchestration layer coordinating all 8 canonical chapters:
 *
 * 01 // ARRIVAL      (0.00 - 0.12)  Low-key studio awakening, silhouette glint
 * 02 // FORM         (0.12 - 0.26)  Wedge proportions, 0.30 Cd aerodynamic discipline
 * 03 // ENGINEERING  (0.26 - 0.44)  Blueprint CAD, valvetrain kinematics & exploded unibody
 * 04 // CABIN        (0.44 - 0.58)  Windshield penetration, cockpit ergonomics & space
 * 05 // MOTION       (0.58 - 0.74)  450m spline highway sequence, 8 dynamic camera shots
 * 06 // ATMOSPHERE   (0.74 - 0.84)  Sun arc, mountain mist, rain & wet asphalt reflections
 * 07 // DETAIL       (0.84 - 0.94)  Macro close-up inspection, headlamps, alloys, rotors
 * 08 // AFTERMATH    (0.94 - 1.00)  Calm horizon equilibrium, hood light sweep, heritage
 *
 * Architecture:
 * - High-frequency mutable state for 60/120fps animation loops (ZERO garbage collection).
 * - React subscriptions via useSyncExternalStore trigger ONLY on discrete chapter boundaries.
 */

export type CinematicChapterId =
  | 'ARRIVAL'
  | 'FORM'
  | 'ENGINEERING'
  | 'CABIN'
  | 'MOTION'
  | 'ATMOSPHERE'
  | 'DETAIL'
  | 'AFTERMATH'

export interface CinematicChapterConfig {
  id: CinematicChapterId
  index: string
  title: string
  subtitle: string
  start: number
  end: number
  anchorId: string
}

export const CINEMATIC_CHAPTERS: readonly CinematicChapterConfig[] = [
  {
    id: 'ARRIVAL',
    index: '01',
    title: 'ARRIVAL',
    subtitle: 'Studio Awakening & Form Emergence',
    start: 0.0,
    end: 0.12,
    anchorId: 'cinematic-timeline',
  },
  {
    id: 'FORM',
    index: '02',
    title: 'FORM',
    subtitle: '0.30 Cd Wedge Aerodynamic Discipline',
    start: 0.12,
    end: 0.26,
    anchorId: 'specifications',
  },
  {
    id: 'ENGINEERING',
    index: '03',
    title: 'ENGINEERING',
    subtitle: 'VTEC Valvetrain Kinematics & Monocoque Chassis',
    start: 0.26,
    end: 0.44,
    anchorId: 'three-engineering-stage',
  },
  {
    id: 'CABIN',
    index: '04',
    title: 'CABIN',
    subtitle: 'Windshield Penetration & Cockpit Ergonomics',
    start: 0.44,
    end: 0.58,
    anchorId: 'interior-stage',
  },
  {
    id: 'MOTION',
    index: '05',
    title: 'MOTION',
    subtitle: 'Dynamic Spline Highway Sequence',
    start: 0.58,
    end: 0.74,
    anchorId: 'road-cinematic',
  },
  {
    id: 'ATMOSPHERE',
    index: '06',
    title: 'ATMOSPHERE',
    subtitle: 'Sun Arc, Mountain Mist & Wet Asphalt Sheen',
    start: 0.74,
    end: 0.84,
    anchorId: 'road-cinematic',
  },
  {
    id: 'DETAIL',
    index: '07',
    title: 'DETAIL',
    subtitle: 'Physical Presence Archive & Macro Studies',
    start: 0.84,
    end: 0.94,
    anchorId: 'automotive-detail-stage',
  },
  {
    id: 'AFTERMATH',
    index: '08',
    title: 'AFTERMATH',
    subtitle: 'Calm Horizon Equilibrium & Enduring Heritage',
    start: 0.94,
    end: 1.0,
    anchorId: 'legacy',
  },
] as const

export interface MasterCinematicState {
  masterProgress: number
  activeChapter: CinematicChapterConfig
  chapterIndex: number
  localChapterProgress: number
  isTransitioning: boolean
  transitionProgress: number
  velocity: number
  scrollDirection: 'DOWN' | 'UP' | 'IDLE'
  cameraMode: string
  vehicleMode: string
  lightingMode: string
  weatherMode: string
}

let mutableMasterProgress = 0
let mutableActiveChapter: CinematicChapterConfig = CINEMATIC_CHAPTERS[0]
let mutableChapterIndex = 0
let mutableLocalProgress = 0
let mutableVelocity = 0
let mutableDirection: 'DOWN' | 'UP' | 'IDLE' = 'IDLE'

// External store listeners for React UI subscriptions
type Listener = () => void
const listeners = new Set<Listener>()

function notifyListeners() {
  for (const listener of listeners) {
    listener()
  }
}

/**
 * Updates the global cinematic master progress from document scroll.
 * Called at 60/120fps from Lenis / ScrollTrigger.
 */
export function setMasterCinematicProgress(
  progress: number,
  velocity: number = 0
): void {
  const clamped = clamp(progress, 0.0, 1.0)
  mutableMasterProgress = clamped
  mutableVelocity = velocity
  mutableDirection = velocity > 0.001 ? 'DOWN' : velocity < -0.001 ? 'UP' : 'IDLE'

  // Resolve active chapter
  let foundIndex = CINEMATIC_CHAPTERS.findIndex(
    (ch, i) =>
      clamped >= ch.start && (clamped < ch.end || i === CINEMATIC_CHAPTERS.length - 1)
  )

  if (foundIndex === -1) {
    foundIndex = clamped <= 0 ? 0 : CINEMATIC_CHAPTERS.length - 1
  }

  const prevIndex = mutableChapterIndex
  mutableChapterIndex = foundIndex
  mutableActiveChapter = CINEMATIC_CHAPTERS[foundIndex]
  mutableLocalProgress = mapRange(
    clamped,
    mutableActiveChapter.start,
    mutableActiveChapter.end,
    0.0,
    1.0,
    true
  )

  // Notify React listeners only when discrete chapter index changes
  if (foundIndex !== prevIndex) {
    notifyListeners()
  }
}

/**
 * Direct high-frequency sample method (ZERO allocation).
 */
export function getCinematicState(): Readonly<MasterCinematicState> {
  return {
    masterProgress: mutableMasterProgress,
    activeChapter: mutableActiveChapter,
    chapterIndex: mutableChapterIndex,
    localChapterProgress: mutableLocalProgress,
    isTransitioning: mutableLocalProgress > 0.82 && mutableChapterIndex < CINEMATIC_CHAPTERS.length - 1,
    transitionProgress: mutableLocalProgress > 0.82
      ? mapRange(mutableLocalProgress, 0.82, 1.0, 0.0, 1.0, true)
      : 0,
    velocity: mutableVelocity,
    scrollDirection: mutableDirection,
    cameraMode: mutableActiveChapter.id,
    vehicleMode: mutableActiveChapter.id === 'ENGINEERING' ? 'EXPLODED' : 'ASSEMBLED',
    lightingMode: mutableActiveChapter.id,
    weatherMode: mutableMasterProgress >= 0.74 ? 'RAIN' : 'CLEAR',
  }
}

/**
 * React hook using useSyncExternalStore for subscribing to discrete chapter changes.
 */
export function useCinematicChapter(): {
  activeChapter: CinematicChapterConfig
  chapterIndex: number
  allChapters: readonly CinematicChapterConfig[]
} {
  const currentChapter = useSyncExternalStore(
    (callback) => {
      listeners.add(callback)
      return () => listeners.delete(callback)
    },
    () => mutableActiveChapter,
    () => CINEMATIC_CHAPTERS[0]
  )

  return {
    activeChapter: currentChapter,
    chapterIndex: mutableChapterIndex,
    allChapters: CINEMATIC_CHAPTERS,
  }
}
