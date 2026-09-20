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
export interface CinematicIntroTargets {
  // Phase 01: Ambient & Blackout Veil
  blackoutVeil?: HTMLElement | null
  studioAtmosphere?: HTMLElement | null

  // Phase 02: Technical Signals
  technicalSignals?: (HTMLElement | null)[]

  // Phase 03: Studio Light Sweep
  lightSweep?: HTMLElement | null

  // Phase 04 & 05: Progressive Vehicle Reveal
  vehicleStage?: HTMLElement | null
  vehicleMask?: HTMLElement | null
  headlightGlow?: HTMLElement | null
  grilleGlow?: HTMLElement | null

  // Phase 06: Editorial Typography Choreography
  titleYear?: HTMLElement | null
  titleMain?: HTMLElement | null
  titleChars?: HTMLElement[]
  titleSeries?: HTMLElement | null
  seriesWords?: HTMLElement[]
  hairline?: HTMLElement | null
  lead?: HTMLElement | null
  leadWords?: HTMLElement[]

  // Phase 08: Minimal Editorial Scroll Invitation
  scrollInvite?: HTMLElement | null
  scrollInviteLine?: HTMLElement | null

  // Ambient HUD
  hudItems?: (HTMLElement | null)[]
  footerActions?: HTMLElement | null
}

/**
 * ----------------------------------------------------------------------------
 * 8-PHASE MASTER CINEMATIC AUTOMOTIVE INTRO TIMELINE (Step 1)
 * ----------------------------------------------------------------------------
 * Choreographs the opening sequence of the 2003 Honda Accord experience:
 * Phase 01: Deep obsidian black, atmosphere breathes
 * Phase 02: Editorial technical annotations ("ARCHIVE / 07", "MODEL / ACCORD", etc.)
 * Phase 03: Studio light sweep across vehicle bodylines
 * Phase 04: Silhouette contour emergence
 * Phase 05: Car progressive reveal: Front Edge → Headlights → Grille → Hood → Body
 * Phase 06: Editorial typography entrance (2003 -> ACCORD -> SEVENTH GENERATION)
 * Phase 07: Handover to living micro-movement
 * Phase 08: Minimal editorial scroll invitation ("SCROLL TO EXPLORE")
 */
export function createCinematicAutomotiveIntroTimeline(
  targets: CinematicIntroTargets,
  options: TimelineOptions = {}
): gsap.core.Timeline {
  const isReduced = prefersReducedMotion()

  const tl = gsap.timeline({
    paused: options.paused ?? false,
    defaults: { ease: 'power3.out' },
    onStart: () => options.onStart?.(),
    onUpdate: () => options.onUpdate?.(),
    onComplete: () => options.onComplete?.(),
  })

  // ACCESSIBILITY: Immediate zero-motion display if reduced motion requested
  if (isReduced) {
    const all = [
      targets.blackoutVeil,
      ...(targets.technicalSignals || []),
      targets.vehicleStage,
      targets.headlightGlow,
      targets.grilleGlow,
      targets.titleYear,
      targets.titleMain,
      targets.titleSeries,
      targets.hairline,
      targets.lead,
      targets.scrollInvite,
      ...(targets.hudItems || []),
      targets.footerActions,
    ].filter(Boolean) as HTMLElement[]

    if (targets.blackoutVeil) tl.set(targets.blackoutVeil, { opacity: 0, display: 'none' })
    if (targets.vehicleStage) tl.set(targets.vehicleStage, { opacity: 1, scale: 1, clearProps: 'transform' })
    if (targets.vehicleMask) tl.set(targets.vehicleMask, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', opacity: 1 })
    if (targets.hairline) tl.set(targets.hairline, { scaleX: 1 })
    if (all.length > 0) tl.set(all, { opacity: 1, clearProps: 'transform' })
    if (targets.technicalSignals) tl.set(targets.technicalSignals.filter(Boolean), { opacity: 0.65 })
    return tl
  }

  // --------------------------------------------------------------------------
  // INITIAL STATE CONFIGURATION (gsap.set)
  // --------------------------------------------------------------------------
  if (targets.blackoutVeil) {
    gsap.set(targets.blackoutVeil, { opacity: 1, display: 'block' })
  }
  if (targets.studioAtmosphere) {
    gsap.set(targets.studioAtmosphere, { opacity: 0 })
  }
  if (targets.technicalSignals && targets.technicalSignals.length > 0) {
    gsap.set(targets.technicalSignals.filter(Boolean), { opacity: 0, y: -8 })
  }
  if (targets.lightSweep) {
    gsap.set(targets.lightSweep, { xPercent: -130, opacity: 0 })
  }
  if (targets.vehicleStage) {
    gsap.set(targets.vehicleStage, { opacity: 0, scale: 0.965, y: 10, transformOrigin: 'center 60%' })
  }
  if (targets.vehicleMask) {
    gsap.set(targets.vehicleMask, {
      opacity: 0.2,
      clipPath: 'none',
    })
  }
  if (targets.headlightGlow) {
    gsap.set(targets.headlightGlow, { opacity: 0, scale: 0.6 })
  }
  if (targets.grilleGlow) {
    gsap.set(targets.grilleGlow, { opacity: 0 })
  }
  if (targets.titleYear) {
    gsap.set(targets.titleYear, { opacity: 0, y: -12 })
  }
  if (targets.titleMain) {
    gsap.set(targets.titleMain, { letterSpacing: '0.12em' })
  }
  if (targets.titleChars && targets.titleChars.length > 0) {
    gsap.set(targets.titleChars, { opacity: 0, y: 44, rotateZ: 0.001 })
  } else if (targets.titleMain) {
    gsap.set(targets.titleMain, { opacity: 0, y: 38 })
  }
  if (targets.seriesWords && targets.seriesWords.length > 0) {
    gsap.set(targets.seriesWords, { opacity: 0, y: 16 })
  } else if (targets.titleSeries) {
    gsap.set(targets.titleSeries, { opacity: 0, y: 16 })
  }
  if (targets.hairline) {
    gsap.set(targets.hairline, { scaleX: 0, transformOrigin: 'left center' })
  }
  if (targets.leadWords && targets.leadWords.length > 0) {
    gsap.set(targets.leadWords, { opacity: 0, y: 16 })
  } else if (targets.lead) {
    gsap.set(targets.lead, { opacity: 0, y: 16 })
  }
  if (targets.scrollInvite) {
    gsap.set(targets.scrollInvite, { opacity: 0, y: 16 })
  }
  const validHud = (targets.hudItems || []).filter(Boolean) as HTMLElement[]
  if (validHud.length > 0) {
    gsap.set(validHud, { opacity: 0, y: -12 })
  }

  // --------------------------------------------------------------------------
  // PHASE 01 — BLACK (Let the opening moment breathe in deep obsidian silence)
  // --------------------------------------------------------------------------
  tl.addLabel('phase-black', 0)
  if (targets.studioAtmosphere) {
    tl.to(
      targets.studioAtmosphere,
      { opacity: 0.38, duration: 1.4, ease: 'sine.out' },
      0.1
    )
  }

  // --------------------------------------------------------------------------
  // PHASE 02 — TECHNICAL SIGNAL (Subtle perimeter engineering annotations)
  // --------------------------------------------------------------------------
  tl.addLabel('phase-technical', 0.5)
  const validSignals = (targets.technicalSignals || []).filter(Boolean) as HTMLElement[]
  if (validSignals.length > 0) {
    tl.to(
      validSignals,
      {
        opacity: 0.75,
        y: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power2.out',
      },
      'phase-technical'
    )
  }

  // --------------------------------------------------------------------------
  // PHASE 03 — LIGHT (Controlled diagonal studio key-light sweep)
  // --------------------------------------------------------------------------
  tl.addLabel('phase-light', 1.1)
  if (targets.lightSweep) {
    tl.to(
      targets.lightSweep,
      {
        xPercent: 130,
        opacity: 0.9,
        duration: 1.35,
        ease: 'power2.inOut',
      },
      'phase-light'
    ).to(
      targets.lightSweep,
      {
        opacity: 0,
        duration: 0.45,
        ease: 'power1.out',
      },
      '-=0.35'
    )
  }

  // --------------------------------------------------------------------------
  // PHASE 04 — SILHOUETTE (Dark contour emergence through the obsidian veil)
  // --------------------------------------------------------------------------
  tl.addLabel('phase-silhouette', 1.45)
  if (targets.blackoutVeil) {
    tl.to(
      targets.blackoutVeil,
      {
        opacity: 0.35,
        duration: 1.1,
        ease: 'power2.inOut',
      },
      'phase-silhouette'
    )
  }

  if (targets.vehicleStage) {
    tl.to(
      targets.vehicleStage,
      {
        opacity: 0.65,
        scale: 0.985,
        y: 3,
        duration: 1.1,
        ease: 'power3.out',
      },
      'phase-silhouette'
    )
  }

  // --------------------------------------------------------------------------
  // PHASE 05 — CAR REVEAL (Front edge → Headlights & Grille → Hood → Complete body)
  // --------------------------------------------------------------------------
  tl.addLabel('phase-reveal', 1.95)

  // Step 1: Front edge expands into headlights
  if (targets.vehicleMask) {
    tl.to(
      targets.vehicleMask,
      {
        opacity: 0.8,
        duration: 0.65,
        ease: 'power2.inOut',
      },
      'phase-reveal'
    )
  }

  // Step 2: Headlights and chrome grille gleam
  if (targets.headlightGlow) {
    tl.to(
      targets.headlightGlow,
      {
        opacity: 0.9,
        scale: 1.05,
        duration: 0.45,
        ease: 'power2.out',
      },
      'phase-reveal+=0.18'
    ).to(
      targets.headlightGlow,
      {
        opacity: 0.35,
        duration: 0.6,
        ease: 'sine.inOut',
      },
      '+=0.05'
    )
  }

  if (targets.grilleGlow) {
    tl.to(
      targets.grilleGlow,
      {
        opacity: 0.8,
        duration: 0.45,
        ease: 'power2.out',
      },
      'phase-reveal+=0.26'
    ).to(
      targets.grilleGlow,
      {
        opacity: 0.25,
        duration: 0.55,
        ease: 'sine.out',
      },
      '+=0.08'
    )
  }

  // Step 3: Complete silhouette expansion across entire vehicle body
  if (targets.vehicleMask) {
    tl.to(
      targets.vehicleMask,
      {
        opacity: 1.0,
        duration: 0.95,
        ease: 'power3.inOut',
      },
      'phase-reveal+=0.38'
    )
  }

  if (targets.vehicleStage) {
    tl.to(
      targets.vehicleStage,
      {
        opacity: 1.0,
        scale: 1.0,
        y: 0,
        duration: 1.2,
        ease: 'power3.out',
      },
      'phase-reveal+=0.38'
    )
  }

  if (targets.blackoutVeil) {
    tl.to(
      targets.blackoutVeil,
      {
        opacity: 0,
        duration: 0.85,
        ease: 'power2.out',
        onComplete: () => {
          if (targets.blackoutVeil) targets.blackoutVeil.style.display = 'none'
        },
      },
      'phase-reveal+=0.45'
    )
  }

  // --------------------------------------------------------------------------
  // PHASE 06 — TYPOGRAPHY (Editorial hierarchy: 2003 -> ACCORD -> Seventh Gen)
  // --------------------------------------------------------------------------
  tl.addLabel('phase-typography', 2.75)

  if (targets.titleYear) {
    tl.to(
      targets.titleYear,
      {
        opacity: 1.0,
        y: 0,
        duration: 0.65,
        ease: 'power2.out',
      },
      'phase-typography'
    )
  }

  // Tracking settle: letter-spacing compresses from wide displacement to benchmark precision
  if (targets.titleMain) {
    tl.to(
      targets.titleMain,
      {
        letterSpacing: '0.02em',
        duration: 1.15,
        ease: 'power3.out',
      },
      'phase-typography+=0.1'
    )
  }

  if (targets.titleChars && targets.titleChars.length > 0) {
    tl.to(
      targets.titleChars,
      {
        opacity: 1.0,
        y: 0,
        duration: 0.92,
        stagger: 0.048,
        ease: 'power3.out',
      },
      'phase-typography+=0.12'
    )
  } else if (targets.titleMain) {
    tl.to(
      targets.titleMain,
      {
        opacity: 1.0,
        y: 0,
        duration: 0.92,
        ease: 'power3.out',
      },
      'phase-typography+=0.12'
    )
  }

  if (targets.seriesWords && targets.seriesWords.length > 0) {
    tl.to(
      targets.seriesWords,
      {
        opacity: 1.0,
        y: 0,
        duration: 0.65,
        stagger: 0.035,
        ease: 'power2.out',
      },
      'phase-typography+=0.28'
    )
  } else if (targets.titleSeries) {
    tl.to(
      targets.titleSeries,
      {
        opacity: 1.0,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
      },
      'phase-typography+=0.28'
    )
  }

  if (targets.hairline) {
    tl.to(
      targets.hairline,
      {
        scaleX: 1,
        duration: 0.8,
        ease: 'power3.inOut',
      },
      'phase-typography+=0.38'
    )
  }

  if (targets.leadWords && targets.leadWords.length > 0) {
    tl.to(
      targets.leadWords,
      {
        opacity: 0.9,
        y: 0,
        duration: 0.7,
        stagger: 0.018,
        ease: 'power2.out',
      },
      'phase-typography+=0.46'
    )
  } else if (targets.lead) {
    tl.to(
      targets.lead,
      {
        opacity: 0.9,
        y: 0,
        duration: 0.75,
        ease: 'power2.out',
      },
      'phase-typography+=0.46'
    )
  }

  // Stagger ambient HUD capsules into position
  if (validHud.length > 0) {
    tl.to(
      validHud,
      {
        opacity: 1.0,
        y: 0,
        duration: 0.65,
        stagger: 0.08,
        ease: 'power2.out',
      },
      'phase-typography+=0.5'
    )
  }

  // --------------------------------------------------------------------------
  // PHASE 08 — SCROLL INVITATION ("SCROLL TO EXPLORE" + Animated Line)
  // --------------------------------------------------------------------------
  tl.addLabel('phase-scroll-cue', 3.55)
  if (targets.scrollInvite) {
    tl.to(
      targets.scrollInvite,
      {
        opacity: 1.0,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
      },
      'phase-scroll-cue'
    )
  }

  return tl
}

// Backward compatibility alias for any existing callers
export const createArrivalEntranceTimeline = createCinematicAutomotiveIntroTimeline

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
