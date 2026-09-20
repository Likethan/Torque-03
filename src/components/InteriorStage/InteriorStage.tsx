import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'
import { Accord3DCanvas } from '../../three/Accord3DCanvas'
import {
  setInteriorMotionProgress,
  setCameraModeState,
} from '../../three/motionBridge'
import {
  setInteriorProgress as setStoreInteriorProgress,
  useInteriorState,
  INTERIOR_TARGETS,
  selectInteriorTarget,
} from '../../three/interior'
import { INTERIOR_WAYPOINTS } from '../../three/camera/interiorWaypoints'
import { sampleInteriorChoreography } from '../../three/camera/cameraChoreography'
import { setScrollMotion } from '../../motion/unifiedMotion'
import { scrollToTarget } from '../../motion/lenisManager'
import { prefersReducedMotion } from '../../animation/gsapConfig'
import { updateInteriorTelemetry } from '../../three/telemetry'
import type { CameraMode } from '../../three/interior/interiorStore'
import './InteriorStage.css'

gsap.registerPlugin(ScrollTrigger)

// Static vectors for sampling
const tempPos = new THREE.Vector3()
const tempTarget = new THREE.Vector3()

/**
 * ----------------------------------------------------------------------------
 * INTERIOR CAMERA STAGE (Step 10 — Interior Camera Transition)
 * ----------------------------------------------------------------------------
 * Pinned scroll-driven section that drives the interior camera journey.
 *
 * Architecture mirrors ThreeEngineeringStage:
 * - Pinned ScrollTrigger (+=300% height for generous scroll travel)
 * - Scrubs interiorProgress from 0.0 → 1.0
 * - Updates cameraMode based on progress thresholds
 * - Reuses the shared R3F Canvas via Accord3DCanvas (no second WebGL context)
 * - Technical sidebar with chapter navigation and interior targets
 *
 * SCROLL POSITION (Lenis inertial scroll)
 *       ↓
 * INTERIOR PROGRESS (0.000 → 1.000 via ScrollTrigger pin track)
 *       ↓
 * INTERIOR WAYPOINT (7 cinematic focal chapters)
 *       ↓
 * CAMERA CHOREOGRAPHY + FOV + LIGHTING
 *       ↓
 * 3D RENDER (shared R3F Canvas)
 */
export function InteriorStage() {
  const pinWrapperRef = useRef<HTMLDivElement>(null)
  const stickyContentRef = useRef<HTMLDivElement>(null)
  const scrollTriggerInstance = useRef<ScrollTrigger | null>(null)

  // Direct DOM refs for high-frequency telemetry updates (zero React re-renders)
  const chapterTagRef = useRef<HTMLSpanElement>(null)
  const chapterHeadingRef = useRef<HTMLHeadingElement>(null)
  const chapterDescRef = useRef<HTMLParagraphElement>(null)
  const scrubFillRef = useRef<HTMLDivElement>(null)
  const scrubPercentRef = useRef<HTMLSpanElement>(null)

  const [activeModeId, setActiveModeId] = useState<string>('EXTERIOR')
  const interiorState = useInteriorState()

  useEffect(() => {
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      const proxy = { progress: 0 }
      let lastChapter = ''

      const tl = gsap.timeline({ paused: true })
      tl.to(proxy, {
        progress: 1.0,
        duration: 1.0,
        ease: 'none',
        onUpdate: () => {
          const prog = proxy.progress

          // Write to motionBridge (consumed by CameraRig, Lighting, Cabin)
          setInteriorMotionProgress(prog)

          // Write to interior store (consumed by annotations, sidebar)
          setStoreInteriorProgress(prog)

          // Derive camera mode
          let mode: CameraMode = 'EXTERIOR'
          if (prog < 0.05) mode = 'EXTERIOR'
          else if (prog < 0.30) mode = 'ENTRY'
          else if (prog < 0.88) mode = 'INTERIOR'
          else mode = 'EXIT'
          setCameraModeState(mode)
          updateInteriorTelemetry(prog, mode, prog > 0.3)

          // Sample interior choreography for HUD data
          const { activeWaypoint } =
            sampleInteriorChoreography(prog, tempPos, tempTarget)

          // Update direct DOM elements
          if (chapterTagRef.current) {
            chapterTagRef.current.textContent = `${activeWaypoint.chapter} // ${activeWaypoint.id}`
          }
          if (chapterHeadingRef.current) {
            chapterHeadingRef.current.textContent = activeWaypoint.title
          }
          if (chapterDescRef.current) {
            chapterDescRef.current.textContent = activeWaypoint.description
          }
          if (scrubFillRef.current) {
            scrubFillRef.current.style.width = `${(prog * 100).toFixed(1)}%`
          }
          if (scrubPercentRef.current) {
            scrubPercentRef.current.textContent = `${Math.round(prog * 100)}%`
          }

          // Unified motion sync
          const currentVel = scrollTriggerInstance.current
            ? scrollTriggerInstance.current.getVelocity() / 1000
            : 0
          const currentDir = scrollTriggerInstance.current
            ? (scrollTriggerInstance.current.direction as -1 | 0 | 1)
            : 0
          setScrollMotion(prog, currentVel, currentDir)

          // Update active chapter badge (React state for sidebar highlighting)
          if (activeWaypoint.id !== lastChapter) {
            lastChapter = activeWaypoint.id
            setActiveModeId(activeWaypoint.id)
          }
        },
      })

      const st = ScrollTrigger.create({
        trigger: pinWrapperRef.current,
        start: 'top top',
        end: '+=300%', // 3 screen-heights for generous interior exploration
        pin: stickyContentRef.current,
        scrub: 0.3,
        animation: tl,
        id: 'interior-stage-choreography-pin',
        anticipatePin: 1,
      })

      scrollTriggerInstance.current = st
    }, pinWrapperRef)

    return () => {
      ctx.revert()
    }
  }, [])

  const handleChapterClick = (wpStart: number) => {
    const st = scrollTriggerInstance.current
    if (!st) return
    const targetScroll = st.start + wpStart * (st.end - st.start)
    scrollToTarget(targetScroll, { duration: 1.4 })
  }

  return (
    <section
      id="interior-3d"
      className="interior-stage-section"
      aria-label="Interior Camera Transition Stage"
    >
      <div ref={pinWrapperRef} className="interior-stage-pin-wrapper">
        <div ref={stickyContentRef} className="interior-stage-sticky-content">
          <div className="container">
            {/* Stage Header */}
            <div className="interior-stage__header">
              <span className="type-label interior-stage__label motion-label" tabIndex={0}>
                Interior Transition // Step 10
              </span>
              <h2 className="type-heading-1 interior-stage__title">
                Cabin Architecture
              </h2>
              <p className="type-body interior-stage__intro">
                A continuous, scroll-driven camera journey that physically enters the 2003 Honda
                Accord cabin. The camera crosses the driver-side glass boundary and settles into
                a natural human-scale driving perspective.
              </p>
            </div>

            <div className="interior-stage__grid">
              {/* 3D Viewport — reusing shared Accord3DCanvas */}
              <div className="interior-stage__viewport-container">
                <Accord3DCanvas interactive showHUD />
              </div>

              {/* Technical Sidebar */}
              <aside className="interior-stage__sidebar" aria-label="Interior Camera Journey">
                {/* Active Chapter Card */}
                <div className="interior-stage__step-card">
                  <span ref={chapterTagRef} className="interior-stage__step-tag">
                    INT-01 // INTERIOR_APPROACH
                  </span>
                  <h3 ref={chapterHeadingRef} className="interior-stage__step-heading">
                    VEHICLE APPROACH
                  </h3>
                  <p ref={chapterDescRef} className="interior-stage__step-desc">
                    The camera transitions from the engineering hero position toward the vehicle body.
                  </p>
                </div>

                {/* Interior Target Selector */}
                <div className="interior-stage__targets">
                  <span className="interior-stage__targets-label">CABIN FOCAL POINTS</span>
                  <div className="interior-stage__targets-grid" role="tablist" aria-label="Interior Targets">
                    {INTERIOR_TARGETS.map((target) => (
                      <button
                        key={target.id}
                        type="button"
                        role="tab"
                        aria-selected={interiorState.selectedTargetId === target.id}
                        className={`interior-stage__target-btn ${
                          interiorState.selectedTargetId === target.id
                            ? 'interior-stage__target-btn--selected'
                            : ''
                        }`}
                        onClick={() =>
                          selectInteriorTarget(
                            interiorState.selectedTargetId === target.id ? null : target.id
                          )
                        }
                      >
                        {target.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chapter Waypoint Navigator */}
                <div className="interior-stage__waypoint-nav">
                  <span className="interior-stage__nav-label">INTERIOR CHAPTER WAYPOINTS</span>
                  <div className="interior-stage__waypoint-list">
                    {INTERIOR_WAYPOINTS.map((wp) => (
                      <button
                        key={wp.id}
                        type="button"
                        className={`interior-stage__waypoint-btn ${
                          activeModeId === wp.id ? 'interior-stage__waypoint-btn--active' : ''
                        }`}
                        onClick={() => handleChapterClick(wp.range.start)}
                        title={`Navigate to ${wp.title}`}
                      >
                        <span>{wp.chapter}</span>
                        <div className="interior-stage__waypoint-indicator" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress Gauge */}
                <div className="interior-stage__scrub-guide">
                  <div className="interior-stage__scrub-row">
                    <span>INTERIOR PROGRESS:</span>
                    <span ref={scrubPercentRef} className="interior-stage__scrub-percent">
                      0%
                    </span>
                  </div>
                  <div className="interior-stage__scrub-indicator">
                    <div className="interior-stage__scrub-bar">
                      <div ref={scrubFillRef} className="interior-stage__scrub-fill" />
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
