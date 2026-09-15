import gsap from 'gsap'
import { GSAP_CONFIG, prefersReducedMotion } from './gsapConfig'

export interface HeroIntroTargets {
  canvasStage?: HTMLElement | null
  modelTag?: HTMLElement | null
  title?: HTMLElement | null
  series?: HTMLElement | null
  hairline?: HTMLElement | null
  lead?: HTMLElement | null
  hudItems?: (HTMLElement | null)[]
  scrubCue?: HTMLElement | null
  footerActions?: HTMLElement | null
}

export interface HeroIntroOptions {
  onStart?: () => void
  onComplete?: () => void
}

/**
 * Hero Cinematic Opening Timeline (Step 6 - GSAP Fundamentals)
 *
 * Choreographs the multi-phase cinematic reveal of the Accord hero composition
 * on initial page load:
 *
 * Phase 1: Initial state established (gsap.set)
 * Phase 2: Canvas stage awakens (gsap.to)
 * Phase 3: Display identity enters (gsap.from)
 * Phase 4: Engineering metadata & structural rule appear (gsap.from / gsap.to)
 * Phase 5: Telemetry HUD and supporting elements stagger into settled state (stagger)
 */
export function createHeroIntroTimeline(
  targets: HeroIntroTargets,
  options: HeroIntroOptions = {}
): gsap.core.Timeline {
  const isReduced = prefersReducedMotion()

  // Create timeline with centralized configuration
  const tl = gsap.timeline({
    paused: false,
    defaults: {
      ease: GSAP_CONFIG.ease.cinematicOut,
    },
    onStart: () => {
      options.onStart?.()
    },
    onComplete: () => {
      options.onComplete?.()
    },
  })

  // Handle Accessibility: Reduced Motion
  if (isReduced) {
    // Reveal all elements immediately without translation offsets
    const allEls = [
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

    tl.set(allEls, {
      opacity: 1,
      clearProps: 'transform',
    })
    return tl
  }

  // --------------------------------------------------------------------------
  // 1. INITIAL STATE CONFIGURATION (gsap.set)
  // --------------------------------------------------------------------------
  // Establish baseline rendering properties before animation starts.
  // Avoids layout jumps and prevents CSS transition conflicts.
  if (targets.hairline) {
    gsap.set(targets.hairline, {
      scaleX: 0,
      transformOrigin: 'left center',
      willChange: 'transform',
    })
  }

  if (targets.canvasStage) {
    gsap.set(targets.canvasStage, {
      opacity: 0.35,
      scale: 0.985,
      willChange: 'transform, opacity',
    })
  }

  // --------------------------------------------------------------------------
  // 2. PHASE 1 & 2: STAGE AWAKENING (gsap.to)
  // --------------------------------------------------------------------------
  // Visual stage awakens from dim silhouette to crisp studio lighting
  if (targets.canvasStage) {
    tl.to(targets.canvasStage, {
      opacity: 1.0,
      scale: 1.0,
      duration: GSAP_CONFIG.durations.stageAwaken,
      ease: GSAP_CONFIG.ease.cinematicOut,
    })
  }

  // --------------------------------------------------------------------------
  // 3. PHASE 3: DISPLAY IDENTITY (gsap.from)
  // --------------------------------------------------------------------------
  // Model tag and display title enter with controlled upward rise
  if (targets.modelTag) {
    tl.from(
      targets.modelTag,
      {
        opacity: 0,
        y: -12,
        duration: 0.65,
        ease: GSAP_CONFIG.ease.technicalOut,
      },
      '<0.25' // Overlaps stage awakening by 0.25s
    )
  }

  if (targets.title) {
    tl.from(
      targets.title,
      {
        opacity: 0,
        y: 36,
        duration: GSAP_CONFIG.durations.titleReveal,
        ease: GSAP_CONFIG.ease.cinematicOut,
      },
      '<0.15' // Enters closely synchronized with the tag
    )
  }

  // --------------------------------------------------------------------------
  // 4. PHASE 4: ENGINEERING METADATA (gsap.from & gsap.to)
  // --------------------------------------------------------------------------
  if (targets.series) {
    tl.from(
      targets.series,
      {
        opacity: 0,
        y: 16,
        duration: GSAP_CONFIG.durations.metadataReveal,
        ease: GSAP_CONFIG.ease.technicalOut,
      },
      '<0.2'
    )
  }

  // Hairline rule expands horizontally from 0 to full width
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

  if (targets.lead) {
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

  // --------------------------------------------------------------------------
  // 5. PHASE 5: TELEMETRY HUD & FOOTER STAGGER (stagger)
  // --------------------------------------------------------------------------
  // Stagger technical telemetry capsules into the viewport
  const validHudItems = (targets.hudItems || []).filter(Boolean) as HTMLElement[]
  if (validHudItems.length > 0) {
    tl.from(
      validHudItems,
      {
        opacity: 0,
        y: -14,
        duration: GSAP_CONFIG.durations.hudEntrance,
        stagger: GSAP_CONFIG.stagger.hudTelemetry,
        ease: GSAP_CONFIG.ease.technicalOut,
      },
      '-=0.45' // Overlaps previous metadata by 0.45s for fluid choreography
    )
  }

  // Bottom scrub prompt and footer actions settle into final positions
  const footerTargets = [targets.scrubCue, targets.footerActions].filter(
    Boolean
  ) as HTMLElement[]

  if (footerTargets.length > 0) {
    tl.from(
      footerTargets,
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
