import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useMotionEngine } from '../../hooks/useMotionEngine'
import { MOTION_CONFIG } from '../../motion/motionConfig'
import { clamp } from '../../motion/clamp'
import { createArrivalTimeline, createArrivalEntranceTimeline } from '../../animation/arrivalTimeline'
import { createFormTimeline } from '../../animation/formTimeline'
import { createChassisTimeline } from '../../animation/chassisTimeline'
import { createPowertrainTimeline } from '../../animation/powertrainTimeline'
import { createConclusionTimeline } from '../../animation/conclusionTimeline'
import { splitText } from '../../typography/splitText'
import { getStoryState } from '../../story/sceneManager'
import {
  subscribeToLenis,
  scrollToTarget,
  toggleSmoothScroll,
  registerLenisDOMBindings,
  type LenisTelemetry,
} from '../../motion/lenisManager'
import {
  registerMagneticTarget,
  registerProximityTarget,
} from '../../interaction/interactionManager'
import { registerInteractionDOMBindings } from '../../interaction/interactionStore'
import { registerThreeDOMBindings } from '../../three/telemetry'
import { registerUnifiedMotionDOMBindings } from '../../motion/unifiedMotion'
import { prefersReducedMotion } from '../../animation/gsapConfig'
import { ScrollSequence } from '../ScrollSequence/ScrollSequence'
import { TechnicalLabelLayer } from '../TechnicalLabel/TechnicalLabel'
import './CinematicStage.css'

gsap.registerPlugin(ScrollTrigger)

export type ActiveSceneTab = 'ARRIVAL' | 'FORM' | 'CHASSIS' | 'POWERTRAIN' | 'CONCLUSION'

export function CinematicStage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRootRef = useRef<HTMLDivElement>(null)
  const stageOverlayRef = useRef<HTMLDivElement>(null)

  const engine = useMotionEngine(containerRef, {
    smoothing: MOTION_CONFIG.progressSmoothing,
    externalScrub: true,
  })

  // --------------------------------------------------------------------------
  // PARALLAX LAYER REFS (Step 10 Layered Parallax Architecture)
  // --------------------------------------------------------------------------
  const bgGridRef = useRef<HTMLDivElement>(null) // Layer 1: Background CAD Grid (rate 0.02)
  const cameraRigRef = useRef<HTMLDivElement>(null) // Layer 2: Camera Viewport Rig (rate 0.06 - 0.08, scale 0.92 -> 1.08)
  const annotationsLayerRef = useRef<HTMLDivElement>(null) // Layer 3: Secondary Technical Annotations (rate 0.10)
  const foregroundLayerRef = useRef<HTMLDivElement>(null) // Layer 4: Foreground Typography & HUD (rate 0.14)

  // Direct DOM refs for high-frequency updates (zero React re-render per frame)
  const timecodeRef = useRef<HTMLSpanElement>(null)
  const frameCounterRef = useRef<HTMLSpanElement>(null)
  const playheadFillRef = useRef<HTMLDivElement>(null)
  const phaseNameRef = useRef<HTMLSpanElement>(null)

  // --------------------------------------------------------------------------
  // CHAPTER 01: ARRIVAL REFS
  // --------------------------------------------------------------------------
  const arrivalLayerRef = useRef<HTMLDivElement>(null)
  const modelTagRef = useRef<HTMLSpanElement>(null)
  const heroTitleRef = useRef<HTMLHeadingElement>(null)
  const heroSeriesRef = useRef<HTMLParagraphElement>(null)
  const hairlineRef = useRef<HTMLHRElement>(null)
  const heroLeadRef = useRef<HTMLParagraphElement>(null)
  const hudLeftRef = useRef<HTMLDivElement>(null)
  const hudRightRef = useRef<HTMLDivElement>(null)
  const playheadRailRef = useRef<HTMLDivElement>(null)
  const scrubCueRef = useRef<HTMLDivElement>(null)
  const footerActionsRef = useRef<HTMLDivElement>(null)

  // Reveal Specs Layer
  const revealLayerRef = useRef<HTMLDivElement>(null)

  // --------------------------------------------------------------------------
  // CHAPTER 02: FORM & AERO REFS
  // --------------------------------------------------------------------------
  const formLayerRef = useRef<HTMLDivElement>(null)
  const formBadgeRef = useRef<HTMLSpanElement>(null)
  const formHairlineRef = useRef<HTMLHRElement>(null)
  const formTitleRef = useRef<HTMLHeadingElement>(null)
  const formLeadRef = useRef<HTMLParagraphElement>(null)
  const formSpecsRefs = useRef<(HTMLDivElement | null)[]>([])

  // --------------------------------------------------------------------------
  // CHAPTER 03: MONOCOQUE CHASSIS REFS
  // --------------------------------------------------------------------------
  const chassisLayerRef = useRef<HTMLDivElement>(null)
  const chassisBadgeRef = useRef<HTMLSpanElement>(null)
  const chassisHairlineRef = useRef<HTMLHRElement>(null)
  const chassisTitleRef = useRef<HTMLHeadingElement>(null)
  const chassisLeadRef = useRef<HTMLParagraphElement>(null)
  const chassisSpecsRefs = useRef<(HTMLDivElement | null)[]>([])

  // --------------------------------------------------------------------------
  // CHAPTER 04: POWERTRAIN HEART REFS
  // --------------------------------------------------------------------------
  const powertrainLayerRef = useRef<HTMLDivElement>(null)
  const powertrainBadgeRef = useRef<HTMLSpanElement>(null)
  const powertrainHairlineRef = useRef<HTMLHRElement>(null)
  const powertrainTitleRef = useRef<HTMLHeadingElement>(null)
  const powertrainLeadRef = useRef<HTMLParagraphElement>(null)
  const powertrainSpecsRefs = useRef<(HTMLDivElement | null)[]>([])

  // --------------------------------------------------------------------------
  // CHAPTER 05: CONCLUSION & SYNTHESIS REFS
  // --------------------------------------------------------------------------
  const conclusionLayerRef = useRef<HTMLDivElement>(null)
  const conclusionBadgeRef = useRef<HTMLSpanElement>(null)
  const conclusionHairlineRef = useRef<HTMLHRElement>(null)
  const conclusionTitleRef = useRef<HTMLHeadingElement>(null)
  const conclusionLeadRef = useRef<HTMLParagraphElement>(null)
  const conclusionSpecsRefs = useRef<(HTMLDivElement | null)[]>([])
  const conclusionCtaRef = useRef<HTMLDivElement>(null)

  // GSAP Micro-Interaction Refs
  const anchorLinkRef = useRef<HTMLAnchorElement>(null)
  const anchorArrowRef = useRef<HTMLSpanElement>(null)

  // --------------------------------------------------------------------------
  // TIMELINES REFS (Step 7 Decoupled Choreography)
  // --------------------------------------------------------------------------
  const masterTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const arrivalTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const formTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const chassisTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const powertrainTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const conclusionTimelineRef = useRef<gsap.core.Timeline | null>(null)

  const [activeTimelineScene, setActiveTimelineScene] = useState<ActiveSceneTab>('ARRIVAL')
  const [timelineTelemetry, setTimelineTelemetry] = useState({
    label: 'darkness',
    progress: 0,
    duration: 0,
    isPlaying: false,
    stateText: 'PAUSED',
  })

  // Lenis Smooth Scroll Telemetry State
  const [lenisTelemetry, setLenisTelemetry] = useState<LenisTelemetry>({
    scroll: 0,
    progress: 0,
    velocity: 0,
    direction: 'IDLE',
    isScrolling: false,
    isEnabled: true,
  })

  // Visual Markers Toggle
  const [showMarkers, setShowMarkers] = useState(false)

  // --------------------------------------------------------------------------
  // STEP 10 & 11 STORYTELLING & TYPOGRAPHY DEBUG MONITOR REFS
  // --------------------------------------------------------------------------
  const debugGlobalProgRef = useRef<HTMLSpanElement>(null)
  const debugActiveSceneRef = useRef<HTMLSpanElement>(null)
  const debugLocalProgRef = useRef<HTMLSpanElement>(null)
  const debugVelocityRef = useRef<HTMLSpanElement>(null)
  const debugSceneStartRef = useRef<HTMLSpanElement>(null)
  const debugSceneEndRef = useRef<HTMLSpanElement>(null)
  const debugPinnedRef = useRef<HTMLSpanElement>(null)
  const debugDirectionRef = useRef<HTMLSpanElement>(null)
  const debugTlProgRef = useRef<HTMLSpanElement>(null)
  const lenisStatusRef = useRef<HTMLSpanElement>(null)

  // Step 11 Kinetic Typography Telemetry
  const debugTextLevelRef = useRef<HTMLSpanElement>(null)
  const debugKineticSceneRef = useRef<HTMLSpanElement>(null)
  const debugTextProgRef = useRef<HTMLSpanElement>(null)

  // Step 12 Interaction Telemetry Refs
  const debugPointerXYRef = useRef<HTMLSpanElement>(null)
  const debugNormalizedXYRef = useRef<HTMLSpanElement>(null)
  const debugVelocityXYRef = useRef<HTMLSpanElement>(null)
  const debugSpeedRef = useRef<HTMLSpanElement>(null)
  const debugActiveTargetRef = useRef<HTMLSpanElement>(null)
  const debugProximityStrengthRef = useRef<HTMLSpanElement>(null)
  const debugMagneticStrengthRef = useRef<HTMLSpanElement>(null)

  // Step 15 3D Choreography Telemetry Refs
  const debugThreeStatusRef = useRef<HTMLSpanElement>(null)
  const debugThreeWaypointRef = useRef<HTMLSpanElement>(null)
  const debugThreeLocalProgRef = useRef<HTMLSpanElement>(null)
  const debugThreeCamPosRef = useRef<HTMLSpanElement>(null)
  const debugThreeTargetRef = useRef<HTMLSpanElement>(null)
  const debugThreeCamRotRef = useRef<HTMLSpanElement>(null)
  const debugThreeObjRotRef = useRef<HTMLSpanElement>(null)
  const debugThreeElevationRef = useRef<HTMLSpanElement>(null)
  const debugThreePointerOffsetRef = useRef<HTMLSpanElement>(null)
  const debugThreeMeshCountRef = useRef<HTMLSpanElement>(null)
  const debugThreeDprRef = useRef<HTMLSpanElement>(null)
  const debugThreeViewportRef = useRef<HTMLSpanElement>(null)

  // Step 16 Mechanical Physics Telemetry Refs
  const debugMechProgressRef = useRef<HTMLSpanElement>(null)
  const debugMechVelocityRef = useRef<HTMLSpanElement>(null)
  const debugExplodedProgressRef = useRef<HTMLSpanElement>(null)
  const debugPrimaryAngleRef = useRef<HTMLSpanElement>(null)
  const debugDrivenAngleRef = useRef<HTMLSpanElement>(null)
  const debugValveLiftRef = useRef<HTMLSpanElement>(null)
  const debugRockerAngleRef = useRef<HTMLSpanElement>(null)
  const debugConstraintStatusRef = useRef<HTMLSpanElement>(null)

  // Step 17 WebGL & GPU Pipeline Telemetry Refs
  const debugWebglVersionRef = useRef<HTMLSpanElement>(null)
  const debugGpuRendererRef = useRef<HTMLSpanElement>(null)
  const debugDrawCallsRef = useRef<HTMLSpanElement>(null)
  const debugTrianglesRef = useRef<HTMLSpanElement>(null)
  const debugGeometriesRef = useRef<HTMLSpanElement>(null)
  const debugTexturesRef = useRef<HTMLSpanElement>(null)
  const debugShaderProgressRef = useRef<HTMLSpanElement>(null)

  // Step 18 Accord GLSL Shader Telemetry Refs
  const debugShaderInspectionRef = useRef<HTMLSpanElement>(null)
  const debugShaderRevealRef = useRef<HTMLSpanElement>(null)
  const debugShaderIntensityRef = useRef<HTMLSpanElement>(null)
  const debugShaderCustomStatusRef = useRef<HTMLSpanElement>(null)

  // Step 19 Unified Motion Architecture Telemetry Refs
  const debugUnifiedProgressRef = useRef<HTMLSpanElement>(null)
  const debugUnifiedSceneRef = useRef<HTMLSpanElement>(null)
  const debugUnifiedLocalProgRef = useRef<HTMLSpanElement>(null)
  const debugUnifiedVelocityRef = useRef<HTMLSpanElement>(null)
  const debugUnifiedDirectionRef = useRef<HTMLSpanElement>(null)
  const debugUnifiedPointerRef = useRef<HTMLSpanElement>(null)
  const debugUnifiedPointerSpeedRef = useRef<HTMLSpanElement>(null)
  const debugUnifiedReducedMotionRef = useRef<HTMLSpanElement>(null)
  const debugUnifiedActiveConsumersRef = useRef<HTMLSpanElement>(null)

  // Development debug overlay visibility (clean editorial experience in production; toggle with 'D')
  const [showDebug, setShowDebug] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.location.search.includes('debug=1')
  })
  const [annotationFrame, setAnnotationFrame] = useState(0)

  useEffect(() => {
    registerLenisDOMBindings({
      statusEl: lenisStatusRef.current,
    })

    registerInteractionDOMBindings({
      pointerXYEl: debugPointerXYRef.current,
      normalizedXYEl: debugNormalizedXYRef.current,
      velocityXYEl: debugVelocityXYRef.current,
      speedEl: debugSpeedRef.current,
      activeTargetEl: debugActiveTargetRef.current,
      proximityStrengthEl: debugProximityStrengthRef.current,
      magneticStrengthEl: debugMagneticStrengthRef.current,
    })

    const unbindThree = registerThreeDOMBindings({
      statusEl: debugThreeStatusRef.current,
      waypointEl: debugThreeWaypointRef.current,
      localProgEl: debugThreeLocalProgRef.current,
      cameraPosEl: debugThreeCamPosRef.current,
      cameraTargetEl: debugThreeTargetRef.current,
      cameraRotEl: debugThreeCamRotRef.current,
      objectRotEl: debugThreeObjRotRef.current,
      componentElevationEl: debugThreeElevationRef.current,
      pointerOffsetEl: debugThreePointerOffsetRef.current,
      meshCountEl: debugThreeMeshCountRef.current,
      pixelRatioEl: debugThreeDprRef.current,
      viewportSizeEl: debugThreeViewportRef.current,
      // Step 16 Mechanical Physics DOM bindings
      mechanicalProgressEl: debugMechProgressRef.current,
      mechanicalVelocityEl: debugMechVelocityRef.current,
      explodedProgressEl: debugExplodedProgressRef.current,
      primaryAngleEl: debugPrimaryAngleRef.current,
      drivenAngleEl: debugDrivenAngleRef.current,
      valveLiftEl: debugValveLiftRef.current,
      rockerAngleEl: debugRockerAngleRef.current,
      constraintStatusEl: debugConstraintStatusRef.current,
      // Step 17 WebGL & GPU DOM bindings
      webglVersionEl: debugWebglVersionRef.current,
      gpuRendererEl: debugGpuRendererRef.current,
      drawCallsEl: debugDrawCallsRef.current,
      trianglesCountEl: debugTrianglesRef.current,
      geometriesCountEl: debugGeometriesRef.current,
      texturesCountEl: debugTexturesRef.current,
      shaderProgressEl: debugShaderProgressRef.current,
      // Step 18 Accord GLSL Shader DOM bindings
      shaderInspectionEl: debugShaderInspectionRef.current,
      shaderRevealEl: debugShaderRevealRef.current,
      shaderIntensityEl: debugShaderIntensityRef.current,
      shaderCustomStatusEl: debugShaderCustomStatusRef.current,
    })

    const unbindUnified = registerUnifiedMotionDOMBindings({
      progressEl: debugUnifiedProgressRef.current,
      sceneEl: debugUnifiedSceneRef.current,
      localProgEl: debugUnifiedLocalProgRef.current,
      velocityEl: debugUnifiedVelocityRef.current,
      directionEl: debugUnifiedDirectionRef.current,
      pointerEl: debugUnifiedPointerRef.current,
      pointerSpeedEl: debugUnifiedPointerSpeedRef.current,
      reducedMotionEl: debugUnifiedReducedMotionRef.current,
      activeConsumersEl: debugUnifiedActiveConsumersRef.current,
    })

    const unbindLenis = subscribeToLenis((metrics) => {
      setLenisTelemetry(metrics)
    })

    return () => {
      unbindThree()
      unbindUnified()
      unbindLenis()
    }
  }, [])

  // Register Step 12 Interactions (Interaction 2: Magnetic CTA; Interaction 3: Spec Proximity)
  useEffect(() => {
    const cleanups: (() => void)[] = []

    // Interaction 2: Magnetic Specifications CTA Button
    if (anchorLinkRef.current) {
      const unregMagnetic = registerMagneticTarget({
        element: anchorLinkRef.current,
        name: 'SPECIFICATIONS CTA',
        radius: 85,
        factor: 0.35,
        maxOffset: 18,
      })
      cleanups.push(unregMagnetic)
    }

    // Interaction 3: Technical Proximity on Powertrain Spec Cards
    powertrainSpecsRefs.current.forEach((el, idx) => {
      if (!el) return
      const unregProx = registerProximityTarget({
        element: el,
        name: `POWERTRAIN SPEC [0${idx + 1}]`,
        radius: 160,
        onStrengthChange: (strength) => {
          if (prefersReducedMotion()) return
          gsap.to(el, {
            y: -strength * 4,
            borderColor:
              strength > 0.05
                ? `hsla(38, 20%, 85%, ${0.2 + strength * 0.5})`
                : 'var(--color-hud-border)',
            backgroundColor:
              strength > 0.05
                ? `hsla(220, 10%, 12%, ${0.5 + strength * 0.4})`
                : 'var(--color-hud-bg)',
            duration: 0.25,
            ease: 'power2.out',
            overwrite: 'auto',
          })
          const crosshair = el.querySelector('.tech-cad-crosshair') as HTMLElement | null
          if (crosshair) {
            gsap.to(crosshair, {
              opacity: 0.35 + strength * 0.65,
              scale: 1 + strength * 0.3,
              duration: 0.2,
              overwrite: 'auto',
            })
          }
        },
      })
      cleanups.push(unregProx)
    })

    return () => {
      cleanups.forEach((c) => c())
    }
  }, [])

  // Helper to read and sync GSAP timeline metrics to debug telemetry
  const updateTimelineTelemetry = (tl: gsap.core.Timeline | null) => {
    if (!tl) return
    const active = tl.isActive()
    const prog = tl.progress()
    let stateText = 'PAUSED'
    if (active) stateText = 'PLAYING'
    else if (prog >= 0.999) stateText = 'SETTLED'
    else if (prog <= 0.001) stateText = 'START'

    setTimelineTelemetry({
      label: tl.currentLabel() || '—',
      progress: prog,
      duration: tl.duration(),
      isPlaying: active,
      stateText,
    })
  }

  // ==========================================================================
  // MASTER SCROLL STORYTELLING & KINETIC TYPOGRAPHY ENGINE (Steps 10 & 11)
  // ==========================================================================
  useEffect(() => {
    if (!stageRootRef.current) return

    const splitReverts: (() => void)[] = []

    // ------------------------------------------------------------------------
    // STEP 11: ACCESSIBLE TEXT SPLITTING
    // ------------------------------------------------------------------------
    // 1. Hero Title: Character-level split ("ACCORD")
    const titleSplit = splitText(heroTitleRef.current, { type: 'chars' })
    if (titleSplit) splitReverts.push(titleSplit.revert)

    // 2. Hero Subtitle & Lead: Word-level split
    const seriesSplit = splitText(heroSeriesRef.current, { type: 'words' })
    if (seriesSplit) splitReverts.push(seriesSplit.revert)

    const leadSplit = splitText(heroLeadRef.current, { type: 'words' })
    if (leadSplit) splitReverts.push(leadSplit.revert)

    // 3. Form Title: Masked words ("Sculpted by Wind and Purpose")
    const formTitleSplit = splitText(formTitleRef.current, { type: 'masked-words' })
    if (formTitleSplit) splitReverts.push(formTitleSplit.revert)

    const formLeadSplit = splitText(formLeadRef.current, { type: 'words' })
    if (formLeadSplit) splitReverts.push(formLeadSplit.revert)

    // 4. Powertrain Title: Masked words ("The Mechanical Heart: 3.0L V6 VTEC")
    const powertrainTitleSplit = splitText(powertrainTitleRef.current, { type: 'masked-words' })
    if (powertrainTitleSplit) splitReverts.push(powertrainTitleSplit.revert)

    const powertrainLeadSplit = splitText(powertrainLeadRef.current, { type: 'words' })
    if (powertrainLeadSplit) splitReverts.push(powertrainLeadSplit.revert)

    const ctx = gsap.context(() => {
      // Establish initial hidden states for later chapter layers
      const inactiveLayers = [
        formLayerRef.current,
        chassisLayerRef.current,
        powertrainLayerRef.current,
        conclusionLayerRef.current,
      ]
      inactiveLayers.forEach((layer) => {
        if (layer) gsap.set(layer, { opacity: 0, pointerEvents: 'none' })
      })

      // Build Master Paused Timeline (Total Duration = 10.0s)
      const masterTl = gsap.timeline({
        paused: true,
        onUpdate: () => updateTimelineTelemetry(masterTl),
      })
      masterTimelineRef.current = masterTl

      // Chapter 01: Arrival Timeline (with kinetic characters and words)
      const arrivalTl = createArrivalTimeline(
        {
          canvasStage: stageOverlayRef.current,
          modelTag: modelTagRef.current,
          title: heroTitleRef.current,
          titleChars: titleSplit?.chars,
          series: heroSeriesRef.current,
          seriesWords: seriesSplit?.words,
          hairline: hairlineRef.current,
          lead: heroLeadRef.current,
          leadWords: leadSplit?.words,
          hudItems: [hudLeftRef.current, hudRightRef.current, playheadRailRef.current],
          scrubCue: scrubCueRef.current,
          footerActions: footerActionsRef.current,
        },
        { paused: true }
      )
      arrivalTimelineRef.current = arrivalTl

      // Play initial entrance animation if landing at top of page
      if (typeof window !== 'undefined' && window.scrollY < 50 && !prefersReducedMotion()) {
        createArrivalEntranceTimeline({
          canvasStage: stageOverlayRef.current,
          modelTag: modelTagRef.current,
          title: heroTitleRef.current,
          titleChars: titleSplit?.chars,
          series: heroSeriesRef.current,
          hairline: hairlineRef.current,
          lead: heroLeadRef.current,
          hudItems: [hudLeftRef.current, hudRightRef.current, playheadRailRef.current],
          scrubCue: scrubCueRef.current,
          footerActions: footerActionsRef.current,
        })
      }

      // Chapter 02: Form Timeline (with masked words)
      const formTl = createFormTimeline(
        {
          container: formLayerRef.current,
          badge: formBadgeRef.current,
          hairline: formHairlineRef.current,
          title: formTitleRef.current,
          titleWords: formTitleSplit?.chars,
          lead: formLeadRef.current,
          leadWords: formLeadSplit?.words,
          specs: formSpecsRefs.current,
        },
        { paused: true }
      )
      formTimelineRef.current = formTl

      // Chapter 03: Chassis Architecture Timeline
      const chassisTl = createChassisTimeline(
        {
          container: chassisLayerRef.current,
          badge: chassisBadgeRef.current,
          title: chassisTitleRef.current,
          hairline: chassisHairlineRef.current,
          lead: chassisLeadRef.current,
          specs: chassisSpecsRefs.current,
        },
        { paused: true }
      )
      chassisTimelineRef.current = chassisTl

      // Chapter 04: Powertrain Timeline (with masked words & spec hierarchy)
      const powertrainTl = createPowertrainTimeline(
        {
          container: powertrainLayerRef.current,
          badge: powertrainBadgeRef.current,
          title: powertrainTitleRef.current,
          titleWords: powertrainTitleSplit?.chars,
          hairline: powertrainHairlineRef.current,
          lead: powertrainLeadRef.current,
          leadWords: powertrainLeadSplit?.words,
          specs: powertrainSpecsRefs.current,
        },
        { paused: true }
      )
      powertrainTimelineRef.current = powertrainTl

      // Chapter 05: Conclusion & Synthesis Timeline
      const conclusionTl = createConclusionTimeline(
        {
          container: conclusionLayerRef.current,
          badge: conclusionBadgeRef.current,
          title: conclusionTitleRef.current,
          hairline: conclusionHairlineRef.current,
          lead: conclusionLeadRef.current,
          specs: conclusionSpecsRefs.current,
          ctaCue: conclusionCtaRef.current,
        },
        { paused: true }
      )
      conclusionTimelineRef.current = conclusionTl

      // ----------------------------------------------------------------------
      // CHOREOGRAPH CONTINUOUS 5-CHAPTER NARRATIVE SEQUENCE
      // ----------------------------------------------------------------------
      masterTl
        // 01 // ARRIVAL (0.00 -> 0.22)
        .add(arrivalTl, 0)
        .addLabel('arrivalEnd', 2.0)

        // Handoff 01 -> 02: Arrival and Reveal fade out, Form emerges
        .to(
          [arrivalLayerRef.current, revealLayerRef.current],
          { opacity: 0, y: -25, duration: 0.4, ease: 'power2.inOut' },
          'arrivalEnd'
        )
        .to(
          formLayerRef.current,
          { opacity: 1, pointerEvents: 'auto', duration: 0.4, ease: 'power2.out' },
          'arrivalEnd+=0.1'
        )

        // 02 // FORM (0.22 -> 0.44)
        .add(formTl, 'arrivalEnd+=0.2')
        .addLabel('formEnd', 4.2)

        // Handoff 02 -> 03: Form fades out, Chassis emerges
        .to(
          formLayerRef.current,
          { opacity: 0, y: -25, duration: 0.4, ease: 'power2.inOut' },
          'formEnd'
        )
        .to(
          chassisLayerRef.current,
          { opacity: 1, pointerEvents: 'auto', duration: 0.4, ease: 'power2.out' },
          'formEnd+=0.1'
        )

        // 03 // ARCHITECTURE / CHASSIS (0.44 -> 0.68)
        .add(chassisTl, 'formEnd+=0.2')
        .addLabel('chassisEnd', 6.6)

        // Handoff 03 -> 04: Chassis fades out, Powertrain emerges
        .to(
          chassisLayerRef.current,
          { opacity: 0, y: -25, duration: 0.4, ease: 'power2.inOut' },
          'chassisEnd'
        )
        .to(
          powertrainLayerRef.current,
          { opacity: 1, pointerEvents: 'auto', duration: 0.4, ease: 'power2.out' },
          'chassisEnd+=0.1'
        )

        // 04 // POWERTRAIN (0.68 -> 0.88)
        .add(powertrainTl, 'chassisEnd+=0.2')
        .addLabel('powertrainEnd', 8.6)

        // Handoff 04 -> 05: Powertrain fades out, Conclusion emerges
        .to(
          powertrainLayerRef.current,
          { opacity: 0, y: -25, duration: 0.4, ease: 'power2.inOut' },
          'powertrainEnd'
        )
        .to(
          conclusionLayerRef.current,
          { opacity: 1, pointerEvents: 'auto', duration: 0.4, ease: 'power2.out' },
          'powertrainEnd+=0.1'
        )

        // 05 // CONCLUSION & SYNTHESIS (0.88 -> 1.00)
        .add(conclusionTl, 'powertrainEnd+=0.2')
        .addLabel('storyComplete', 10.0)

      // ----------------------------------------------------------------------
      // SCROLLTRIGGER PINNED STAGE (4200px Continuous Scroll Travel)
      // ----------------------------------------------------------------------
      ScrollTrigger.create({
        trigger: stageRootRef.current,
        pin: true,
        start: 'top top',
        end: '+=4200',
        scrub: 1,
        animation: masterTl,
        id: 'cinematic-story-stage',
        markers: showMarkers
          ? {
              startColor: '#38bdf8',
              endColor: '#0369a1',
              fontSize: '11px',
              indent: 20,
            }
          : false,
        onUpdate: (self) => {
          const globalProgress = self.progress
          const scrollVelocity = self.getVelocity() / 1000
          const isPinned = self.isActive && globalProgress > 0.001 && globalProgress < 0.999

          const storyState = getStoryState(globalProgress, scrollVelocity, isPinned)

          // 1. Scrub MotionEngine canvas frames
          engine.setTargetProgress(globalProgress)

          // 2. Camera Rig Approach & Composition
          if (cameraRigRef.current) {
            const cameraScale = 0.92 + globalProgress * 0.14
            const cameraPanX =
              storyState.activeScene.id === 'powertrain'
                ? 18 * storyState.localProgress
                : 0
            cameraRigRef.current.style.transform = `scale(${cameraScale.toFixed(4)}) translate3d(${cameraPanX.toFixed(1)}px, 0, 0)`
          }

          // 3. Layered Parallax with Velocity Drift
          if (bgGridRef.current) {
            const bgY = globalProgress * -40 + clamp(scrollVelocity * -6, -10, 10)
            bgGridRef.current.style.transform = `translate3d(0, ${bgY.toFixed(2)}px, 0)`
          }

          if (annotationsLayerRef.current) {
            const annoY = globalProgress * -65 + clamp(scrollVelocity * -12, -18, 18)
            annotationsLayerRef.current.style.transform = `translate3d(0, ${annoY.toFixed(2)}px, 0)`
          }

          if (foregroundLayerRef.current) {
            const foreY = globalProgress * -90 + clamp(scrollVelocity * -16, -22, 22)
            foregroundLayerRef.current.style.transform = `translate3d(0, ${foreY.toFixed(2)}px, 0)`
          }

          // 4. Zero-React-Render Telemetry Direct DOM Updates
          if (debugGlobalProgRef.current) {
            debugGlobalProgRef.current.textContent = globalProgress.toFixed(4)
          }
          if (debugActiveSceneRef.current) {
            debugActiveSceneRef.current.textContent = storyState.activeScene.id.toUpperCase()
          }
          if (debugLocalProgRef.current) {
            debugLocalProgRef.current.textContent = storyState.localProgress.toFixed(4)
          }
          if (debugVelocityRef.current) {
            const velStr =
              (scrollVelocity >= 0 ? '+' : '') + scrollVelocity.toFixed(4) + ' px/f'
            debugVelocityRef.current.textContent = velStr
          }
          if (debugSceneStartRef.current) {
            debugSceneStartRef.current.textContent = storyState.activeScene.start.toFixed(4)
          }
          if (debugSceneEndRef.current) {
            debugSceneEndRef.current.textContent = storyState.activeScene.end.toFixed(4)
          }
          if (debugPinnedRef.current) {
            debugPinnedRef.current.textContent = isPinned ? 'YES' : 'NO'
            debugPinnedRef.current.style.color = isPinned
              ? 'var(--color-accent)'
              : 'var(--color-text-muted)'
          }
          if (debugDirectionRef.current) {
            const dirText = self.direction >= 0 ? 'DOWN' : 'UP'
            debugDirectionRef.current.textContent = dirText
            debugDirectionRef.current.style.color =
              dirText === 'DOWN' ? 'var(--color-accent)' : 'var(--color-accent-red)'
          }
          if (debugTlProgRef.current) {
            debugTlProgRef.current.textContent = masterTl.progress().toFixed(4)
          }
          if (phaseNameRef.current) {
            phaseNameRef.current.textContent = `${storyState.activeScene.chapter} // ${storyState.activeScene.title}`
          }

          // Step 11 Kinetic Typography Telemetry
          if (debugTextLevelRef.current) {
            const levelText =
              storyState.activeScene.id === 'arrival'
                ? 'CHAR STAGGER ("ACCORD")'
                : storyState.activeScene.id === 'form'
                ? 'MASKED WORDS ("SCULPTED")'
                : storyState.activeScene.id === 'powertrain'
                ? 'SPEC HIERARCHY (POWERTRAIN)'
                : 'KINETIC HIERARCHY'
            debugTextLevelRef.current.textContent = levelText
          }
          if (debugKineticSceneRef.current) {
            debugKineticSceneRef.current.textContent = storyState.activeScene.id.toUpperCase()
          }
          if (debugTextProgRef.current) {
            debugTextProgRef.current.textContent = storyState.localProgress.toFixed(4)
          }
        },
      })

      ScrollTrigger.refresh()
    }, stageRootRef)

    return () => {
      ctx.revert() // Strict Mode safe: cleans up timelines and ScrollTriggers
      splitReverts.forEach((revert) => revert()) // Restores original DOM strings cleanly
    }
  }, [showMarkers, engine])

  // ==========================================================================
  // TIMELINE PLAYBACK CONTROLLER HANDLERS
  // ==========================================================================
  const getActiveTimeline = () => {
    switch (activeTimelineScene) {
      case 'ARRIVAL':
        return arrivalTimelineRef.current
      case 'FORM':
        return formTimelineRef.current
      case 'CHASSIS':
        return chassisTimelineRef.current
      case 'POWERTRAIN':
        return powertrainTimelineRef.current
      case 'CONCLUSION':
        return conclusionTimelineRef.current
      default:
        return arrivalTimelineRef.current
    }
  }

  const handlePlay = () => {
    const tl = getActiveTimeline()
    if (tl) {
      tl.play()
      updateTimelineTelemetry(tl)
    }
  }

  const handlePause = () => {
    const tl = getActiveTimeline()
    if (tl) {
      tl.pause()
      updateTimelineTelemetry(tl)
    }
  }

  const handleReverse = () => {
    const tl = getActiveTimeline()
    if (tl) {
      tl.reverse()
      updateTimelineTelemetry(tl)
    }
  }

  const handleRestart = () => {
    const tl = getActiveTimeline()
    if (tl) {
      tl.restart()
      updateTimelineTelemetry(tl)
    }
  }

  const handleScrub = (prog: number) => {
    const tl = getActiveTimeline()
    if (tl) {
      tl.progress(prog)
      updateTimelineTelemetry(tl)
    }
  }

  const handleSwitchScene = (scene: ActiveSceneTab) => {
    setActiveTimelineScene(scene)
    const tl =
      scene === 'ARRIVAL'
        ? arrivalTimelineRef.current
        : scene === 'FORM'
        ? formTimelineRef.current
        : scene === 'CHASSIS'
        ? chassisTimelineRef.current
        : scene === 'POWERTRAIN'
        ? powertrainTimelineRef.current
        : conclusionTimelineRef.current

    if (tl) {
      updateTimelineTelemetry(tl)
    }
  }

  // Specifications Anchor Link Hover Interaction
  const handleAnchorEnter = () => {
    if (anchorLinkRef.current && anchorArrowRef.current) {
      gsap.to(anchorLinkRef.current, {
        borderColor: 'var(--color-accent-red)',
        backgroundColor: 'hsla(356, 85%, 45%, 0.12)',
        duration: 0.28,
        ease: 'power2.out',
        overwrite: 'auto',
      })
      gsap.to(anchorArrowRef.current, {
        x: 4,
        color: 'var(--color-accent-red)',
        duration: 0.28,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }
  }

  const handleAnchorLeave = () => {
    if (anchorLinkRef.current && anchorArrowRef.current) {
      gsap.to(anchorLinkRef.current, {
        borderColor: 'var(--color-hud-border)',
        backgroundColor: 'var(--color-hud-bg)',
        duration: 0.32,
        ease: 'power2.out',
        overwrite: 'auto',
      })
      gsap.to(anchorArrowRef.current, {
        x: 0,
        color: 'var(--color-text-secondary)',
        duration: 0.32,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }
  }

  // Register DOM bindings with MotionEngine for frame and timecode updates
  useEffect(() => {
    engine.registerDOMBindings({
      timecodeEl: timecodeRef.current,
      frameCounterEl: frameCounterRef.current,
      playheadFillEl: playheadFillRef.current,
      phaseNameEl: phaseNameRef.current,
      arrivalLayerEl: arrivalLayerRef.current,
      revealLayerEl: revealLayerRef.current,
      formLayerEl: formLayerRef.current,
    })
  }, [engine])

  // Integer frame subscription for technical annotations
  useEffect(() => {
    let lastFrame = -1
    const unbind = engine.subscribe((state) => {
      if (state.currentFrame !== lastFrame) {
        lastFrame = state.currentFrame
        setAnnotationFrame(state.currentFrame)
      }
    })
    return unbind
  }, [engine])

  // Keybinding 'D' to toggle debug mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        setShowDebug((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <section
      ref={stageRootRef}
      id="cinematic-timeline"
      className="cinematic-stage-root"
      aria-label="2003 Honda Accord Cinematic Timeline"
    >
      <ScrollSequence
        engine={engine}
        containerRef={containerRef}
        totalFrames={MOTION_CONFIG.totalFrames}
        stageHeight="100vh"
      >
        <div ref={stageOverlayRef} className="cinema-viewport-overlay">
          {/* DEPTH LAYER 1: Background CAD Coordinate Drafting Grid (rate 0.02) */}
          <div ref={bgGridRef} className="cinema-parallax-bg-grid" aria-hidden="true" />

          {/* DEPTH LAYER 2: Camera Rig Viewport Wrapper */}
          <div ref={cameraRigRef} className="cinema-camera-rig">
            {/* DEPTH LAYER 3: Secondary Technical Annotations (rate 0.10) */}
            <div ref={annotationsLayerRef} className="cinema-parallax-annotations">
              <TechnicalLabelLayer currentFrame={annotationFrame} />
            </div>

            {/* DEPTH LAYER 4: Foreground Typography & Chapter Layers (rate 0.14) */}
            <div ref={foregroundLayerRef} className="cinema-parallax-foreground">
              {/* TOP CINEMA HUD: Timecode, Frame Counter, Timeline Specs */}
              <header className="cinema-top-hud" aria-label="Cinematic Playback Status">
                <div ref={hudLeftRef} className="cinema-hud-left">
                  <span className="cinema-hud-live-dot" />
                  <span className="cinema-hud-tag">CINEMATIC STORY ENGINE</span>
                  <span className="cinema-hud-sep">·</span>
                  <span ref={phaseNameRef} className="cinema-hud-phase">
                    CH-01 // ARRIVAL &amp; AWAKENING
                  </span>
                </div>

                <div ref={hudRightRef} className="cinema-hud-right">
                  <span ref={timecodeRef} className="cinema-hud-timecode">
                    00:00:00:00
                  </span>
                  <span className="cinema-hud-sep">·</span>
                  <span ref={frameCounterRef} className="cinema-hud-frame">
                    FRAME 000 / 100
                  </span>
                </div>
              </header>

              {/* TIMELINE SCRUBBER RAIL: Direct DOM playhead width updates */}
              <div ref={playheadRailRef} className="cinema-playhead-rail" aria-hidden="true">
                <div ref={playheadFillRef} className="cinema-playhead-fill" />
              </div>

              {/* -------------------------------------------------------------- */}
              {/* CHAPTER 01 — ARRIVAL TYPOGRAPHY LAYER (Kinetic Characters)     */}
              {/* -------------------------------------------------------------- */}
              <div ref={arrivalLayerRef} className="cinema-layer-arrival container">
                <div className="cinema-arrival-header">
                  <span ref={modelTagRef} className="cinema-model-tag">
                    HONDA · 2003 MODEL YEAR
                  </span>
                  <h1 ref={heroTitleRef} className="cinema-hero-title">
                    ACCORD
                  </h1>
                  <p ref={heroSeriesRef} className="cinema-hero-series">
                    Seventh Generation · CM Series Benchmark
                  </p>
                  <hr ref={hairlineRef} className="cinema-hairline-rule" />
                  <p ref={heroLeadRef} className="cinema-hero-lead">
                    An intentional departure from convention. Engineered with European athletic
                    proportions, low-drag aerodynamic discipline, and the benchmark 240-horsepower
                    V6 VTEC.
                  </p>
                </div>
              </div>

              {/* REVEAL METADATA LAYER */}
              <div ref={revealLayerRef} className="cinema-layer-reveal container">
                <div className="cinema-reveal-badge">
                  <span className="cinema-reveal-eyebrow">ENGINEERING IDENTIFICATION</span>
                  <h2 className="cinema-reveal-title">Structural &amp; Dynamic Benchmark</h2>
                </div>

                <div className="cinema-specs-strip">
                  <div className="cinema-spec-cell">
                    <span className="cinema-spec-num">240</span>
                    <span className="cinema-spec-unit">HP</span>
                    <span className="cinema-spec-lbl">3.0L V6 VTEC at 6,250 RPM</span>
                  </div>
                  <div className="cinema-spec-cell">
                    <span className="cinema-spec-num">0.30</span>
                    <span className="cinema-spec-unit">Cd</span>
                    <span className="cinema-spec-lbl">Wind-Tunnel Aerodynamic Profile</span>
                  </div>
                  <div className="cinema-spec-cell">
                    <span className="cinema-spec-num">106.9</span>
                    <span className="cinema-spec-unit">in</span>
                    <span className="cinema-spec-lbl">Double-Wishbone Wheelbase</span>
                  </div>
                  <div className="cinema-spec-cell">
                    <span className="cinema-spec-num">5 ★</span>
                    <span className="cinema-spec-unit">Rating</span>
                    <span className="cinema-spec-lbl">NHTSA Frontal Safety Benchmark</span>
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------------- */}
              {/* CHAPTER 02 — FORM & AERODYNAMICS LAYER (Masked Words)          */}
              {/* -------------------------------------------------------------- */}
              <div ref={formLayerRef} className="cinema-layer-form container">
                <div className="cinema-form-header">
                  <span ref={formBadgeRef} className="cinema-model-tag">
                    01 / EXTERIOR ARCHITECTURE
                  </span>
                  <h2 ref={formTitleRef} className="cinema-form-title">
                    Sculpted by Wind and Purpose
                  </h2>
                  <hr ref={formHairlineRef} className="cinema-form-hairline" />
                  <p ref={formLeadRef} className="cinema-form-lead">
                    Departing from traditional three-box sedans, the seventh-generation Accord merged
                    monocoque structural stiffness with an aerodynamic wedge profile engineered to
                    endure.
                  </p>
                  <div className="cinema-form-specs">
                    <div
                      ref={(el) => {
                        formSpecsRefs.current[0] = el
                      }}
                      className="cinema-form-spec-cell"
                    >
                      <span className="cinema-form-spec-val">106.9"</span>
                      <span className="cinema-form-spec-lbl">Wheelbase</span>
                    </div>
                    <div
                      ref={(el) => {
                        formSpecsRefs.current[1] = el
                      }}
                      className="cinema-form-spec-cell"
                    >
                      <span className="cinema-form-spec-val">0.30 Cd</span>
                      <span className="cinema-form-spec-lbl">Wind Tunnel</span>
                    </div>
                    <div
                      ref={(el) => {
                        formSpecsRefs.current[2] = el
                      }}
                      className="cinema-form-spec-cell"
                    >
                      <span className="cinema-form-spec-val">189.5"</span>
                      <span className="cinema-form-spec-lbl">Length</span>
                    </div>
                    <div
                      ref={(el) => {
                        formSpecsRefs.current[3] = el
                      }}
                      className="cinema-form-spec-cell"
                    >
                      <span className="cinema-form-spec-val">48%</span>
                      <span className="cinema-form-spec-lbl">Steel Monocoque</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------------- */}
              {/* CHAPTER 03 — MONOCOQUE CHASSIS ARCHITECTURE LAYER             */}
              {/* -------------------------------------------------------------- */}
              <div ref={chassisLayerRef} className="cinema-layer-chassis container">
                <div className="cinema-chassis-header">
                  <span ref={chassisBadgeRef} className="cinema-model-tag">
                    02 / MONOCOQUE CHASSIS
                  </span>
                  <h2 ref={chassisTitleRef} className="cinema-chassis-title">
                    High-Rigidity Unibody &amp; Chassis Dynamics
                  </h2>
                  <hr ref={chassisHairlineRef} className="cinema-chassis-hairline" />
                  <p ref={chassisLeadRef} className="cinema-chassis-lead">
                    Engineered with a laser-welded floorpan and 48% high-tensile steel, the 2003
                    Accord delivers a 27% increase in torsional stiffness combined with racing-derived
                    double-wishbone geometry.
                  </p>
                  <div className="cinema-chassis-specs">
                    <div
                      ref={(el) => {
                        chassisSpecsRefs.current[0] = el
                      }}
                      className="cinema-form-spec-cell"
                    >
                      <span className="cinema-form-spec-val">+27%</span>
                      <span className="cinema-form-spec-lbl">Torsional Rigidity</span>
                    </div>
                    <div
                      ref={(el) => {
                        chassisSpecsRefs.current[1] = el
                      }}
                      className="cinema-form-spec-cell"
                    >
                      <span className="cinema-form-spec-val">48%</span>
                      <span className="cinema-form-spec-lbl">High-Tensile Steel</span>
                    </div>
                    <div
                      ref={(el) => {
                        chassisSpecsRefs.current[2] = el
                      }}
                      className="cinema-form-spec-cell"
                    >
                      <span className="cinema-form-spec-val">Dbl-Wishbone</span>
                      <span className="cinema-form-spec-lbl">Front Geometry</span>
                    </div>
                    <div
                      ref={(el) => {
                        chassisSpecsRefs.current[3] = el
                      }}
                      className="cinema-form-spec-cell"
                    >
                      <span className="cinema-form-spec-val">5 ★ NHTSA</span>
                      <span className="cinema-form-spec-lbl">Safety Benchmark</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------------- */}
              {/* CHAPTER 04 — POWERTRAIN MECHANICAL HEART LAYER (Spec Hierarchy)*/}
              {/* -------------------------------------------------------------- */}
              <div ref={powertrainLayerRef} className="cinema-layer-powertrain container">
                <div className="cinema-powertrain-header">
                  <span ref={powertrainBadgeRef} className="cinema-model-tag">
                    03 / POWERTRAIN HEART
                  </span>
                  <h2 ref={powertrainTitleRef} className="cinema-powertrain-title">
                    The Mechanical Heart: 3.0L V6 VTEC
                  </h2>
                  <hr ref={powertrainHairlineRef} className="cinema-powertrain-hairline" />
                  <p ref={powertrainLeadRef} className="cinema-powertrain-lead">
                    The all-aluminum 24-valve V6 combines Variable Valve Timing and Lift Electronic
                    Control with drive-by-wire throttle response, producing an effortless 240
                    horsepower and 212 lb-ft of torque.
                  </p>
                  <div className="cinema-powertrain-specs">
                    <div
                      ref={(el) => {
                        powertrainSpecsRefs.current[0] = el
                      }}
                      className="cinema-form-spec-cell"
                    >
                      <span className="tech-cad-marker">
                        <span className="tech-cad-crosshair" /> J30A4 // 60° V6
                      </span>
                      <span className="cinema-form-spec-val">240 HP</span>
                      <span className="cinema-form-spec-lbl">@ 6,250 RPM</span>
                    </div>
                    <div
                      ref={(el) => {
                        powertrainSpecsRefs.current[1] = el
                      }}
                      className="cinema-form-spec-cell"
                    >
                      <span className="tech-cad-marker">
                        <span className="tech-cad-crosshair" /> TORQUE BAND
                      </span>
                      <span className="cinema-form-spec-val">212 lb-ft</span>
                      <span className="cinema-form-spec-lbl">@ 5,000 RPM</span>
                    </div>
                    <div
                      ref={(el) => {
                        powertrainSpecsRefs.current[2] = el
                      }}
                      className="cinema-form-spec-cell"
                    >
                      <span className="tech-cad-marker">
                        <span className="tech-cad-crosshair" /> COMPRESSION
                      </span>
                      <span className="cinema-form-spec-val">10.0:1</span>
                      <span className="cinema-form-spec-lbl">Piston Ratio</span>
                    </div>
                    <div
                      ref={(el) => {
                        powertrainSpecsRefs.current[3] = el
                      }}
                      className="cinema-form-spec-cell"
                    >
                      <span className="tech-cad-marker">
                        <span className="tech-cad-crosshair" /> INDUCTION
                      </span>
                      <span className="cinema-form-spec-val">DBW Throttle</span>
                      <span className="cinema-form-spec-lbl">Electronic Drive</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------------- */}
              {/* CHAPTER 05 — CONCLUSION & SYNTHESIS LAYER                      */}
              {/* -------------------------------------------------------------- */}
              <div ref={conclusionLayerRef} className="cinema-layer-conclusion container">
                <div className="cinema-conclusion-header">
                  <span ref={conclusionBadgeRef} className="cinema-model-tag">
                    04 / SYNTHESIS &amp; HORIZON
                  </span>
                  <h2 ref={conclusionTitleRef} className="cinema-conclusion-title">
                    Engineering as a Complete Discipline
                  </h2>
                  <hr ref={conclusionHairlineRef} className="cinema-conclusion-hairline" />
                  <p ref={conclusionLeadRef} className="cinema-conclusion-lead">
                    Chassis rigidity, low-drag aerodynamics, and mechanical powertrain discipline
                    coalesce into the definitive 7th-generation Accord. Explore the complete technical
                    specifications archive below.
                  </p>
                  <div className="cinema-conclusion-specs">
                    <div
                      ref={(el) => {
                        conclusionSpecsRefs.current[0] = el
                      }}
                      className="cinema-form-spec-cell"
                    >
                      <span className="cinema-form-spec-val">CM Series</span>
                      <span className="cinema-form-spec-lbl">7th Gen Benchmark</span>
                    </div>
                    <div
                      ref={(el) => {
                        conclusionSpecsRefs.current[1] = el
                      }}
                      className="cinema-form-spec-cell"
                    >
                      <span className="cinema-form-spec-val">0.30 Cd</span>
                      <span className="cinema-form-spec-lbl">Aero Profile</span>
                    </div>
                    <div
                      ref={(el) => {
                        conclusionSpecsRefs.current[2] = el
                      }}
                      className="cinema-form-spec-cell"
                    >
                      <span className="cinema-form-spec-val">V6 VTEC</span>
                      <span className="cinema-form-spec-lbl">Mechanical Heart</span>
                    </div>
                    <div
                      ref={(el) => {
                        conclusionSpecsRefs.current[3] = el
                      }}
                      className="cinema-form-spec-cell"
                    >
                      <span className="cinema-form-spec-val">Double-Wishbone</span>
                      <span className="cinema-form-spec-lbl">Chassis Dynamic</span>
                    </div>
                  </div>
                  <div ref={conclusionCtaRef} className="cinema-conclusion-cta">
                    <span>SCROLL DOWN TO ACCESS FULL ARCHIVE</span>
                    <span>↓</span>
                  </div>
                </div>
              </div>

              {/* BOTTOM CINEMA FOOTER: Scrub Prompt & Jump Nav */}
              <footer className="cinema-bottom-hud" aria-label="Timeline Navigation Cue">
                <div ref={scrubCueRef} className="cinema-scrub-cue">
                  <div className="cinema-scrub-arrow" aria-hidden="true">
                    ↓
                  </div>
                  <span className="cinema-scrub-label">
                    SCROLL TO SCRUB STORY · REVERSE WITH UP-SCROLL
                  </span>
                </div>

                <div ref={footerActionsRef} className="cinema-footer-actions">
                  {!showDebug && (
                    <button
                      type="button"
                      className="cinema-debug-toggle-btn"
                      onClick={() => setShowDebug(true)}
                      title="Show Storytelling Debug Monitor"
                    >
                      DEBUG [D]
                    </button>
                  )}
                  <a
                    ref={anchorLinkRef}
                    href="#specifications"
                    className="cinema-anchor-link"
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToTarget('#specifications')
                    }}
                    onMouseEnter={handleAnchorEnter}
                    onMouseLeave={handleAnchorLeave}
                  >
                    <span>Specifications</span>
                    <span ref={anchorArrowRef} className="cinema-anchor-arrow">
                      →
                    </span>
                  </a>
                </div>
              </footer>
            </div>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* STEP 11 STORYTELLING & KINETIC TYPOGRAPHY DEBUG MONITOR            */}
          {/* ------------------------------------------------------------------ */}
          {showDebug && (
            <aside className="cinema-debug-hud" aria-label="Storytelling & Typography Debug Monitor">
              <div className="cinema-debug-header">
                <span className="cinema-debug-title">STEP 12 INTERACTION &amp; STORY MONITOR</span>
                <button
                  type="button"
                  className="cinema-debug-close"
                  onClick={() => setShowDebug(false)}
                  title="Hide Debug HUD (press 'D' to toggle)"
                >
                  ✕
                </button>
              </div>
              <div className="cinema-debug-grid">
                <span className="cinema-debug-lbl">GLOBAL PROGRESS:</span>
                <span ref={debugGlobalProgRef} className="cinema-debug-val">
                  0.0000
                </span>

                <span className="cinema-debug-lbl">ACTIVE SCENE:</span>
                <span
                  ref={debugActiveSceneRef}
                  className="cinema-debug-val"
                  style={{ color: 'var(--color-accent)' }}
                >
                  ARRIVAL
                </span>

                <span className="cinema-debug-lbl">LOCAL PROGRESS:</span>
                <span ref={debugLocalProgRef} className="cinema-debug-val">
                  0.0000
                </span>

                <span className="cinema-debug-lbl">SCROLL VELOCITY:</span>
                <span ref={debugVelocityRef} className="cinema-debug-val cinema-debug-val--vel">
                  ● +0.0000 px/f
                </span>

                <span className="cinema-debug-lbl">SCENE START:</span>
                <span ref={debugSceneStartRef} className="cinema-debug-val">
                  0.0000
                </span>

                <span className="cinema-debug-lbl">SCENE END:</span>
                <span ref={debugSceneEndRef} className="cinema-debug-val">
                  0.2200
                </span>

                <span className="cinema-debug-lbl">PINNED:</span>
                <span ref={debugPinnedRef} className="cinema-debug-val cinema-debug-val--status">
                  NO
                </span>

                <span className="cinema-debug-lbl">DIRECTION:</span>
                <span ref={debugDirectionRef} className="cinema-debug-val cinema-debug-val--phase">
                  DOWN
                </span>

                {/* Step 11: Kinetic Typography Telemetry */}
                <span className="cinema-debug-lbl">TEXT LEVEL:</span>
                <span
                  ref={debugTextLevelRef}
                  className="cinema-debug-val"
                  style={{ color: 'var(--color-accent-red)' }}
                >
                  CHAR STAGGER ("ACCORD")
                </span>

                <span className="cinema-debug-lbl">KINETIC SCENE:</span>
                <span
                  ref={debugKineticSceneRef}
                  className="cinema-debug-val"
                  style={{ color: 'var(--color-accent)' }}
                >
                  ARRIVAL
                </span>

                <span className="cinema-debug-lbl">TEXT PROGRESS:</span>
                <span ref={debugTextProgRef} className="cinema-debug-val">
                  0.0000
                </span>

                <span className="cinema-debug-lbl">TIMELINE PROGRESS:</span>
                <span ref={debugTlProgRef} className="cinema-debug-val">
                  0.0000
                </span>

                <span className="cinema-debug-lbl">LENIS:</span>
                <span ref={lenisStatusRef} className="cinema-debug-val">
                  ACTIVE
                </span>

                {/* Step 12: Interaction System Telemetry */}
                <span className="cinema-debug-lbl" style={{ color: 'var(--color-accent-red)' }}>
                  POINTER (X, Y):
                </span>
                <span ref={debugPointerXYRef} className="cinema-debug-val">
                  (0, 0)
                </span>

                <span className="cinema-debug-lbl">NORMALIZED (X, Y):</span>
                <span ref={debugNormalizedXYRef} className="cinema-debug-val">
                  (+0.00, +0.00)
                </span>

                <span className="cinema-debug-lbl">VELOCITY (X, Y):</span>
                <span ref={debugVelocityXYRef} className="cinema-debug-val cinema-debug-val--vel">
                  0.00, 0.00
                </span>

                <span className="cinema-debug-lbl">POINTER SPEED:</span>
                <span ref={debugSpeedRef} className="cinema-debug-val">
                  0.00 px/ms
                </span>

                <span className="cinema-debug-lbl">ACTIVE TARGET:</span>
                <span
                  ref={debugActiveTargetRef}
                  className="cinema-debug-val"
                  style={{ color: 'var(--color-accent)' }}
                >
                  NONE
                </span>

                <span className="cinema-debug-lbl">PROXIMITY STRENGTH:</span>
                <span ref={debugProximityStrengthRef} className="cinema-debug-val">
                  0.000
                </span>

                <span className="cinema-debug-lbl">MAGNETIC STRENGTH:</span>
                <span ref={debugMagneticStrengthRef} className="cinema-debug-val">
                  0.000
                </span>

                {/* Step 15: 3D Camera Choreography Telemetry */}
                <span className="cinema-debug-lbl" style={{ color: 'var(--color-accent-red)' }}>
                  3D PIPELINE:
                </span>
                <span ref={debugThreeStatusRef} className="cinema-debug-val" style={{ color: 'var(--color-accent)' }}>
                  STANDBY
                </span>

                <span className="cinema-debug-lbl">ACTIVE WAYPOINT:</span>
                <span ref={debugThreeWaypointRef} className="cinema-debug-val" style={{ color: 'var(--color-accent-red)', fontWeight: 600 }}>
                  ARRIVAL
                </span>

                <span className="cinema-debug-lbl">LOCAL PROGRESS:</span>
                <span ref={debugThreeLocalProgRef} className="cinema-debug-val" style={{ color: 'var(--color-accent)' }}>
                  0.0%
                </span>

                <span className="cinema-debug-lbl">CAMERA POSITION:</span>
                <span ref={debugThreeCamPosRef} className="cinema-debug-val">
                  (0.00, 0.00, 0.00)
                </span>

                <span className="cinema-debug-lbl">CAMERA TARGET:</span>
                <span ref={debugThreeTargetRef} className="cinema-debug-val">
                  (0.00, 0.00, 0.00)
                </span>

                <span className="cinema-debug-lbl">CAMERA ROTATION:</span>
                <span ref={debugThreeCamRotRef} className="cinema-debug-val">
                  (0.00, 0.00, 0.00)
                </span>

                <span className="cinema-debug-lbl">OBJECT ROTATION:</span>
                <span ref={debugThreeObjRotRef} className="cinema-debug-val">
                  (0.00, 0.00, 0.00)
                </span>

                <span className="cinema-debug-lbl">COMPONENT ELEVATION:</span>
                <span ref={debugThreeElevationRef} className="cinema-debug-val">
                  +0.00m
                </span>

                <span className="cinema-debug-lbl">POINTER OFFSET:</span>
                <span ref={debugThreePointerOffsetRef} className="cinema-debug-val">
                  (+0.00, +0.00)
                </span>

                <span className="cinema-debug-lbl">OBJECT COUNT:</span>
                <span ref={debugThreeMeshCountRef} className="cinema-debug-val">
                  0
                </span>

                <span className="cinema-debug-lbl">RENDERER DPR:</span>
                <span ref={debugThreeDprRef} className="cinema-debug-val">
                  1.00x
                </span>

                <span className="cinema-debug-lbl">VIEWPORT SIZE:</span>
                <span ref={debugThreeViewportRef} className="cinema-debug-val">
                  0 × 0 px
                </span>
              </div>

              {/* STEP 16 MECHANICAL PHYSICS & VALVETRAIN KINEMATICS */}
              <div className="cinema-debug-section-title" style={{ marginTop: '0.65rem' }}>
                <span>STEP 16: VALVETRAIN KINEMATICS & PROCEDURAL PHYSICS</span>
                <span className="cinema-debug-badge" style={{ color: 'var(--color-accent)' }}>RATIO -2.0</span>
              </div>
              <div className="cinema-debug-grid">
                <span className="cinema-debug-lbl">MECHANICAL VELOCITY:</span>
                <span ref={debugMechVelocityRef} className="cinema-debug-val">
                  +0.00 u/s
                </span>

                <span className="cinema-debug-lbl">CAMSHAFT ANGLE:</span>
                <span ref={debugPrimaryAngleRef} className="cinema-debug-val">
                  0.0° (0.00 rev)
                </span>

                <span className="cinema-debug-lbl">DRIVEN GEAR ANGLE:</span>
                <span ref={debugDrivenAngleRef} className="cinema-debug-val">
                  0.0° [Ratio -2.0]
                </span>

                <span className="cinema-debug-lbl">VALVE LIFT TRAVEL:</span>
                <span ref={debugValveLiftRef} className="cinema-debug-val" style={{ color: 'var(--color-accent)' }}>
                  0.00 mm (Max 11.20 mm)
                </span>

                <span className="cinema-debug-lbl">ROCKER DEFLECTION:</span>
                <span ref={debugRockerAngleRef} className="cinema-debug-val">
                  0.0° [Hinge Limits -2.3° / +12.6°]
                </span>

                <span className="cinema-debug-lbl">EXPLODED DISASSEMBLY:</span>
                <span ref={debugExplodedProgressRef} className="cinema-debug-val">
                  0% (ASSEMBLED)
                </span>

                <span className="cinema-debug-lbl">KINEMATIC STATUS:</span>
                <span ref={debugConstraintStatusRef} className="cinema-debug-val" style={{ color: 'var(--color-technical-cyan, #00d4ff)' }}>
                  OPTIMAL
                </span>
              </div>

              {/* STEP 17 WEBGL & GPU PIPELINE TELEMETRY */}
              <div className="cinema-debug-section-title" style={{ marginTop: '0.65rem' }}>
                <span>STEP 17: WEBGL & GPU PIPELINE</span>
                <span className="cinema-debug-badge" style={{ color: 'var(--color-technical-cyan, #00d4ff)' }}>SHADERMATERIAL</span>
              </div>
              <div className="cinema-debug-grid">
                <span className="cinema-debug-lbl">WEBGL CONTEXT:</span>
                <span ref={debugWebglVersionRef} className="cinema-debug-val" style={{ color: 'var(--color-accent)' }}>
                  WebGL 2.0
                </span>

                <span className="cinema-debug-lbl">GPU RENDERER:</span>
                <span ref={debugGpuRendererRef} className="cinema-debug-val" style={{ fontSize: '0.68rem', wordBreak: 'break-all' }}>
                  Detecting GPU...
                </span>

                <span className="cinema-debug-lbl">GPU DRAW CALLS:</span>
                <span ref={debugDrawCallsRef} className="cinema-debug-val">
                  0
                </span>

                <span className="cinema-debug-lbl">SCENE TRIANGLES:</span>
                <span ref={debugTrianglesRef} className="cinema-debug-val">
                  0
                </span>

                <span className="cinema-debug-lbl">GPU GEOMETRIES:</span>
                <span ref={debugGeometriesRef} className="cinema-debug-val">
                  0
                </span>

                <span className="cinema-debug-lbl">ACTIVE TEXTURES:</span>
                <span ref={debugTexturesRef} className="cinema-debug-val">
                  0
                </span>

                <span className="cinema-debug-lbl">SHADER uPROGRESS:</span>
                <span ref={debugShaderProgressRef} className="cinema-debug-val" style={{ color: 'var(--color-accent)' }}>
                  0.0%
                </span>
              </div>

              {/* STEP 18 ACCORD GLSL SHADER SYSTEM TELEMETRY */}
              <div className="cinema-debug-section-title" style={{ marginTop: '0.65rem' }}>
                <span>STEP 18: ACCORD GLSL SHADER SYSTEM</span>
                <span ref={debugShaderCustomStatusRef} className="cinema-debug-badge" style={{ color: 'var(--color-accent-red)' }}>
                  GLSL ACTIVE
                </span>
              </div>
              <div className="cinema-debug-grid">
                <span className="cinema-debug-lbl">uINSPECTION:</span>
                <span ref={debugShaderInspectionRef} className="cinema-debug-val" style={{ color: 'var(--color-accent-red)' }}>
                  0.00 (0.0%)
                </span>

                <span className="cinema-debug-lbl">uREVEAL:</span>
                <span ref={debugShaderRevealRef} className="cinema-debug-val">
                  0.00
                </span>

                <span className="cinema-debug-lbl">uINTENSITY:</span>
                <span ref={debugShaderIntensityRef} className="cinema-debug-val" style={{ color: 'var(--color-accent)' }}>
                  1.00
                </span>
              </div>

              {/* STEP 19 UNIFIED MOTION ARCHITECTURE TELEMETRY */}
              <div className="cinema-debug-section-title" style={{ marginTop: '0.65rem' }}>
                <span>STEP 19: UNIFIED MOTION ARCHITECTURE</span>
                <span className="cinema-debug-badge" style={{ color: 'var(--color-accent)' }}>
                  DETERMINISTIC // 11 STAGES
                </span>
              </div>
              <div className="cinema-debug-grid">
                <span className="cinema-debug-lbl">AUTHORITATIVE PROG:</span>
                <span ref={debugUnifiedProgressRef} className="cinema-debug-val" style={{ color: 'var(--color-accent-red)' }}>
                  0.0%
                </span>

                <span className="cinema-debug-lbl">CANONICAL SCENE:</span>
                <span ref={debugUnifiedSceneRef} className="cinema-debug-val">
                  CH-01 // ARRIVAL
                </span>

                <span className="cinema-debug-lbl">LOCAL SCENE PROG:</span>
                <span ref={debugUnifiedLocalProgRef} className="cinema-debug-val" style={{ color: 'var(--color-accent)' }}>
                  0.0%
                </span>

                <span className="cinema-debug-lbl">SCROLL VELOCITY:</span>
                <span ref={debugUnifiedVelocityRef} className="cinema-debug-val">
                  0.000 px/f
                </span>

                <span className="cinema-debug-lbl">SCROLL DIRECTION:</span>
                <span ref={debugUnifiedDirectionRef} className="cinema-debug-val">
                  IDLE
                </span>

                <span className="cinema-debug-lbl">POINTER (NX, NY):</span>
                <span ref={debugUnifiedPointerRef} className="cinema-debug-val">
                  (0.00, 0.00)
                </span>

                <span className="cinema-debug-lbl">POINTER SPEED:</span>
                <span ref={debugUnifiedPointerSpeedRef} className="cinema-debug-val">
                  0.0 px/s
                </span>

                <span className="cinema-debug-lbl">REDUCED MOTION:</span>
                <span ref={debugUnifiedReducedMotionRef} className="cinema-debug-val">
                  OFF (FULL)
                </span>

                <span className="cinema-debug-lbl">ACTIVE CONSUMERS:</span>
                <span ref={debugUnifiedActiveConsumersRef} className="cinema-debug-val" style={{ fontSize: '0.68rem' }}>
                  8 ACTIVE [LENIS, ST, GSAP, PTR, R3F, CAM, MECH, GLSL]
                </span>
              </div>

              {/* TIMELINE PLAYBACK CONTROLLER FOR SCENE PREVIEWS */}
              <div className="cinema-tl-ctrl-group">
                <div className="cinema-tl-ctrl-title">
                  <span>CHAPTER PREVIEW CONTROLLER</span>
                  <span
                    className="cinema-tl-telemetry-badge"
                    style={{
                      color:
                        timelineTelemetry.stateText === 'PLAYING'
                          ? 'var(--color-accent-red)'
                          : 'var(--color-accent)',
                    }}
                  >
                    {timelineTelemetry.stateText}
                  </span>
                </div>

                <div className="cinema-tl-scene-tabs">
                  {(['ARRIVAL', 'FORM', 'CHASSIS', 'POWERTRAIN', 'CONCLUSION'] as ActiveSceneTab[]).map(
                    (tab) => (
                      <button
                        key={tab}
                        type="button"
                        className={`cinema-tl-tab-btn ${
                          activeTimelineScene === tab ? 'cinema-tl-tab-btn--active' : ''
                        }`}
                        onClick={() => handleSwitchScene(tab)}
                      >
                        {tab}
                      </button>
                    )
                  )}
                </div>

                <div className="cinema-tl-telemetry-row">
                  <span>
                    Label:{' '}
                    <strong className="cinema-tl-telemetry-badge">
                      {timelineTelemetry.label}
                    </strong>
                  </span>
                  <span>
                    Duration:{' '}
                    <strong className="cinema-tl-telemetry-badge">
                      {timelineTelemetry.duration.toFixed(2)}s
                    </strong>
                  </span>
                </div>
                <div className="cinema-tl-telemetry-row">
                  <span>Playhead Progress:</span>
                  <span className="cinema-tl-telemetry-badge">
                    {(timelineTelemetry.progress * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="cinema-tl-btn-row">
                  <button
                    type="button"
                    className="cinema-tl-btn"
                    onClick={handlePlay}
                    title="Play active timeline"
                  >
                    ▶ PLAY
                  </button>
                  <button
                    type="button"
                    className="cinema-tl-btn"
                    onClick={handlePause}
                    title="Pause active timeline"
                  >
                    ⏸ PAUSE
                  </button>
                  <button
                    type="button"
                    className="cinema-tl-btn"
                    onClick={handleReverse}
                    title="Reverse active timeline"
                  >
                    ◀ REV
                  </button>
                  <button
                    type="button"
                    className="cinema-tl-btn"
                    onClick={handleRestart}
                    title="Restart active timeline"
                  >
                    ↻ RESTART
                  </button>
                </div>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.002"
                  value={timelineTelemetry.progress}
                  onChange={(e) => handleScrub(parseFloat(e.target.value))}
                  className="cinema-tl-scrub-slider"
                  title="Scrub timeline progress"
                  aria-label="Timeline progress scrubber"
                />

                {/* Live A/B Toggle for Native vs Lenis Inertial Scroll */}
                <button
                  type="button"
                  className="cinema-debug-replay-btn"
                  style={{
                    marginTop: '0.45rem',
                    borderStyle: 'dashed',
                    color: lenisTelemetry.isEnabled
                      ? 'var(--color-accent)'
                      : 'var(--color-text-tertiary)',
                  }}
                  onClick={() => {
                    const newState = toggleSmoothScroll()
                    setLenisTelemetry((prev) => ({ ...prev, isEnabled: newState }))
                  }}
                  title="Toggle Lenis Smooth Scroll on/off for live A/B comparison"
                >
                  ⚡ TOGGLE SMOOTH SCROLL ({lenisTelemetry.isEnabled ? 'ON' : 'OFF'})
                </button>

                {/* Live Toggle for Visual ScrollTrigger Markers */}
                <button
                  type="button"
                  className="cinema-debug-replay-btn"
                  style={{
                    marginTop: '0.35rem',
                    borderStyle: 'dashed',
                    color: showMarkers
                      ? 'var(--color-accent-red)'
                      : 'var(--color-text-secondary)',
                    borderColor: showMarkers
                      ? 'var(--color-accent-red)'
                      : 'var(--color-hud-border)',
                  }}
                  onClick={() => setShowMarkers((prev) => !prev)}
                  title="Toggle visual ScrollTrigger start/end/pin markers on screen"
                >
                  🎯 TOGGLE ST MARKERS ({showMarkers ? 'ON' : 'OFF'})
                </button>
              </div>

              <div className="cinema-debug-hint">Press 'D' to toggle monitor</div>
            </aside>
          )}
        </div>
      </ScrollSequence>
    </section>
  )
}
