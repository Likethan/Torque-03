import gsap from 'gsap'
import { GSAP_CONFIG, prefersReducedMotion } from './gsapConfig'

export interface ArrivalTimelineTargets {
  canvasStage?: HTMLElement | null
  modelTag?: HTMLElement | null
  title?: HTMLElement | null
  titleChars?: HTMLElement[]
  series?: HTMLElement | null
  seriesWords?: HTMLElement[]
  lead?: HTMLElement | null
  leadWords?: HTMLElement[]
  hairline?: HTMLElement | null
  hudItems?: (HTMLElement | null)[]
  scrubCue?: HTMLElement | null
  footerActions?: HTMLElement | null
}

export interface TimelineOptions {
  paused?: boolean
  onStart?: () => void
  onUpdate?: () => void
  onComplete?: () => void
}

/**
 * ----------------------------------------------------------------------------
 * SUB-TIMELINE 1: VEHICLE STAGE AWAKENING
 * ----------------------------------------------------------------------------
 * Animates the vehicle visual stage from initial low-key silhouette into
 * crisp studio key-light focus.
 */
export function createVehicleRevealTimeline(
  targets: ArrivalTimelineTargets
): gsap.core.Timeline {
  const tl = gsap.timeline()

  if (targets.canvasStage) {
    // gsap.to(): Transitions the stage from pre-set 0.35 opacity and 0.985 scale
    // to full 1.0 optical scale and exposure over 1.4s
    tl.to(targets.canvasStage, {
      opacity: 1.0,
      scale: 1.0,
      duration: GSAP_CONFIG.durations.stageAwaken,
      ease: GSAP_CONFIG.ease.cinematicOut,
    })
  }

  return tl
}

/**
 * ----------------------------------------------------------------------------
 * SUB-TIMELINE 2: DISPLAY IDENTITY (Step 11 Kinetic Character Stagger)
 * ----------------------------------------------------------------------------
 * Sequences the primary identification:
 * Model Year Tag ("HONDA · 2003 MODEL YEAR") and Display Title ("ACCORD").
 */
export function createIdentityTimeline(
  targets: ArrivalTimelineTargets
): gsap.core.Timeline {
  const tl = gsap.timeline()

  // 1. Model Tag drops subtly from above
  if (targets.modelTag) {
    tl.from(targets.modelTag, {
      opacity: 0,
      y: -12,
      duration: 0.65,
      ease: GSAP_CONFIG.ease.technicalOut,
    })
  }

  // 2. Display Title rises with character-by-character spatial sequence
  // If titleChars are split, animate each character with subtle stagger
  if (targets.titleChars && targets.titleChars.length > 0) {
    tl.fromTo(
      targets.titleChars,
      {
        opacity: 0,
        y: 28,
      },
      {
        opacity: 1,
        y: 0,
        duration: GSAP_CONFIG.durations.titleReveal,
        stagger: 0.045,
        ease: GSAP_CONFIG.ease.cinematicOut,
      },
      '<0.15'
    )
  } else if (targets.title) {
    tl.from(
      targets.title,
      {
        opacity: 0,
        y: 36,
        duration: GSAP_CONFIG.durations.titleReveal,
        ease: GSAP_CONFIG.ease.cinematicOut,
      },
      '<0.15'
    )
  }

  return tl
}

/**
 * ----------------------------------------------------------------------------
 * SUB-TIMELINE 3: TECHNICAL INFORMATION & HUD TELEMETRY
 * ----------------------------------------------------------------------------
 * Reveals secondary specifications, hairline divider rule, editorial lead,
 * and staggers the top HUD capsules into place.
 */
export function createTechnicalRevealTimeline(
  targets: ArrivalTimelineTargets
): gsap.core.Timeline {
  const tl = gsap.timeline()

  // 1. Series subtitle ("Seventh Generation · CM Series Benchmark")
  if (targets.seriesWords && targets.seriesWords.length > 0) {
    tl.fromTo(
      targets.seriesWords,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: GSAP_CONFIG.durations.metadataReveal,
        stagger: 0.04,
        ease: GSAP_CONFIG.ease.technicalOut,
      }
    )
  } else if (targets.series) {
    tl.from(targets.series, {
      opacity: 0,
      y: 16,
      duration: GSAP_CONFIG.durations.metadataReveal,
      ease: GSAP_CONFIG.ease.technicalOut,
    })
  }

  // 2. Structural hairline rule draws open from left to right
  // POSITION PARAMETER: "<0.15"
  if (targets.hairline) {
    tl.to(
      targets.hairline,
      {
        scaleX: 1,
        duration: GSAP_CONFIG.durations.hairlineDraw,
        ease: GSAP_CONFIG.ease.structuralInOut,
      },
      '<0.15'
    )
  }

  // 3. Editorial lead paragraph enters
  // POSITION PARAMETER: "<0.2"
  if (targets.leadWords && targets.leadWords.length > 0) {
    tl.fromTo(
      targets.leadWords,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: GSAP_CONFIG.durations.metadataReveal,
        stagger: 0.02,
        ease: GSAP_CONFIG.ease.technicalOut,
      },
      '<0.2'
    )
  } else if (targets.lead) {
    tl.from(
      targets.lead,
      {
        opacity: 0,
        y: 18,
        duration: GSAP_CONFIG.durations.metadataReveal,
        ease: GSAP_CONFIG.ease.technicalOut,
      },
      '<0.2'
    )
  }

  // 4. Staggered reveal of top HUD capsules (timecode, live indicator, frame counter)
  // STAGGER: Iterates over array of elements with 0.12s sequential offset
  // POSITION PARAMETER: "-=0.4" (starts 0.4s BEFORE lead paragraph completes)
  const hudItems = (targets.hudItems || []).filter(Boolean) as HTMLElement[]
  if (hudItems.length > 0) {
    tl.from(
      hudItems,
      {
        opacity: 0,
        y: -14,
        duration: GSAP_CONFIG.durations.hudEntrance,
        stagger: GSAP_CONFIG.stagger.hudTelemetry,
        ease: GSAP_CONFIG.ease.technicalOut,
      },
      '-=0.4'
    )
  }

  // 5. Bottom scrub cue and footer actions settle
  // POSITION PARAMETER: "<0.15"
  const footerItems = [targets.scrubCue, targets.footerActions].filter(
    Boolean
  ) as HTMLElement[]
  if (footerItems.length > 0) {
    tl.from(
      footerItems,
      {
        opacity: 0,
        y: 14,
        duration: GSAP_CONFIG.durations.supportingSettle,
        stagger: GSAP_CONFIG.stagger.footerActions,
        ease: GSAP_CONFIG.ease.technicalOut,
      },
      '<0.15'
    )
  }

  return tl
}

/**
 * ----------------------------------------------------------------------------
 * MASTER CINEMATIC ARRIVAL TIMELINE (Step 7 - Cinematic Timelines)
 * ----------------------------------------------------------------------------
 * Composes the modular sub-timelines using TIMELINE LABELS and POSITION PARAMETERS.
 *
 * Sequence:
 *   [Label: "darkness"]    Baseline initialization via gsap.set()
 *   [Label: "vehicle"]     Stage awakens (createVehicleRevealTimeline)
 *   [Label: "identity"]    Tag & Title enter (createIdentityTimeline)
 *   [Label: "technical"]   Metadata, rule, & HUD stagger (createTechnicalRevealTimeline)
 *   [Label: "composition"] Elements lock into final optical balance
 *   [Label: "settle"]      Final poised resting state
 */
/**
 * ----------------------------------------------------------------------------
 * ENTRANCE CINEMATIC ARRIVAL TIMELINE
 * ----------------------------------------------------------------------------
 * Plays upon page load / preloader dismissal to animate elements into their
 * poised resting positions.
 */
export function createArrivalEntranceTimeline(
  targets: ArrivalTimelineTargets,
  options: TimelineOptions = {}
): gsap.core.Timeline {
  const isReduced = prefersReducedMotion()

  const tl = gsap.timeline({
    paused: options.paused ?? false,
    defaults: { ease: GSAP_CONFIG.ease.cinematicOut },
    onStart: () => options.onStart?.(),
    onUpdate: () => options.onUpdate?.(),
    onComplete: () => options.onComplete?.(),
  })

  if (isReduced) {
    const all = [
      targets.canvasStage,
      targets.modelTag,
      targets.title,
      targets.series,
      targets.hairline,
      targets.lead,
      ...(targets.hudItems || []),
      targets.scrubCue,
      targets.footerActions,
    ].filter(Boolean)
    tl.set(all, { opacity: 1, clearProps: 'transform' })
    if (targets.hairline) tl.set(targets.hairline, { scaleX: 1 })
    return tl
  }

  // Animate into place
  if (targets.canvasStage) {
    tl.fromTo(
      targets.canvasStage,
      { opacity: 0.5, scale: 0.985 },
      { opacity: 1, scale: 1, duration: 1.0, ease: 'power2.out' },
      0
    )
  }

  if (targets.modelTag) {
    tl.fromTo(
      targets.modelTag,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      0.1
    )
  }

  if (targets.titleChars && targets.titleChars.length > 0) {
    tl.fromTo(
      targets.titleChars,
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.035, ease: 'power3.out' },
      0.15
    )
  } else if (targets.title) {
    tl.fromTo(
      targets.title,
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
      0.15
    )
  }

  if (targets.series) {
    tl.fromTo(
      targets.series,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      0.3
    )
  }

  if (targets.hairline) {
    tl.fromTo(
      targets.hairline,
      { scaleX: 0 },
      { scaleX: 1, duration: 0.65, ease: 'power2.inOut', transformOrigin: 'left center' },
      0.35
    )
  }

  if (targets.lead) {
    tl.fromTo(
      targets.lead,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      0.4
    )
  }

  const hudItems = (targets.hudItems || []).filter(Boolean) as HTMLElement[]
  if (hudItems.length > 0) {
    tl.fromTo(
      hudItems,
      { opacity: 0, y: -10 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' },
      0.45
    )
  }

  const footerItems = [targets.scrubCue, targets.footerActions].filter(Boolean) as HTMLElement[]
  if (footerItems.length > 0) {
    tl.fromTo(
      footerItems,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' },
      0.5
    )
  }

  return tl
}

/**
 * ----------------------------------------------------------------------------
 * MASTER CINEMATIC ARRIVAL TIMELINE (Scroll-Linked)
 * ----------------------------------------------------------------------------
 * Operates within the scroll-scrubbed master timeline.
 * At scroll 0 (progress 0), all arrival elements are fully visible and settled.
 * As the user scrolls towards the end of Chapter 01, elements smoothly transition out.
 */
export function createArrivalTimeline(
  targets: ArrivalTimelineTargets,
  options: TimelineOptions = {}
): gsap.core.Timeline {
  const masterTimeline = gsap.timeline({
    paused: options.paused ?? false,
    defaults: {
      ease: GSAP_CONFIG.ease.cinematicOut,
    },
    onStart: () => options.onStart?.(),
    onUpdate: () => options.onUpdate?.(),
    onComplete: () => options.onComplete?.(),
  })

  // Baseline: Ensure all elements are visible and poised at progress 0
  const allElements = [
    targets.modelTag,
    targets.title,
    ...(targets.titleChars || []),
    targets.series,
    ...(targets.seriesWords || []),
    targets.lead,
    ...(targets.leadWords || []),
    ...(targets.hudItems || []),
    targets.scrubCue,
    targets.footerActions,
  ].filter(Boolean) as HTMLElement[]

  if (allElements.length > 0) {
    gsap.set(allElements, { opacity: 1, y: 0 })
  }
  if (targets.hairline) {
    gsap.set(targets.hairline, { scaleX: 1, transformOrigin: 'left center' })
  }
  if (targets.canvasStage) {
    gsap.set(targets.canvasStage, { opacity: 1, scale: 1 })
  }

  // During scroll scrub:
  // 0.0s to 1.3s: Hold fully visible and stable for reading
  // 1.3s to 2.0s: Smoothly transition out to hand over to Chapter 02 (Form)
  masterTimeline
    .addLabel('arrivalStable', 0)
    .to(
      allElements,
      {
        opacity: 0,
        y: -24,
        duration: 0.65,
        stagger: 0.015,
        ease: 'power2.inOut',
      },
      1.35
    )
    .addLabel('arrivalEnd', 2.0)

  return masterTimeline
}
