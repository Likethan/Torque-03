import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'
import { Accord3DCanvas } from '../../three/Accord3DCanvas'
import { setChoreographyProgress, setMechanicalVelocity } from '../../three/motionBridge'
import { setScrollMotion } from '../../motion/unifiedMotion'
import { CAMERA_WAYPOINTS } from '../../three/camera/cameraWaypoints'
import { sampleChoreography } from '../../three/camera/cameraChoreography'
import type { CameraStateId } from '../../three/camera/cameraTypes'
import { scrollToTarget } from '../../motion/lenisManager'
import { prefersReducedMotion } from '../../animation/gsapConfig'
import {
  useExplodedState,
  toggleExplodedState,
  selectExplodedComponent,
} from '../../three/exploded/explodedStore'
import {
  COMPONENT_MAP,
  ENGINEERING_COMPONENTS,
} from '../../three/exploded/explodedComponents'
import './ThreeEngineeringStage.css'

gsap.registerPlugin(ScrollTrigger)

// Static vectors for sampleChoreography
const tempPos = new THREE.Vector3()
const tempTarget = new THREE.Vector3()

/**
 * ----------------------------------------------------------------------------
 * THREE ENGINEERING STAGE (Step 15 — 3D Choreography)
 * ----------------------------------------------------------------------------
 * Pinned cinematic scroll sequence coordinating:
 *
 * SCROLL POSITION (Lenis inertial scroll)
 *       ↓
 * GLOBAL PROGRESS (0.000 → 1.000 via ScrollTrigger pin track)
 *       ↓
 * SCENE RANGE (8 Canonical Waypoint bounds)
 *       ↓
 * LOCAL PROGRESS (0.000 → 1.000 clamped)
 *       ↓
 * CAMERA CHOREOGRAPHY & OBJECT ELEVATION
 *       ↓
 * 3D RENDER (R3F Canvas)
 */
export function ThreeEngineeringStage() {
  const pinWrapperRef = useRef<HTMLDivElement>(null)
  const stickyContentRef = useRef<HTMLDivElement>(null)
  const scrollTriggerInstance = useRef<ScrollTrigger | null>(null)

  // Direct DOM refs for high-frequency telemetry & text updates (zero React re-renders)
  const waypointTagRef = useRef<HTMLSpanElement>(null)
  const waypointHeadingRef = useRef<HTMLHeadingElement>(null)
  const waypointDescRef = useRef<HTMLParagraphElement>(null)
  const scrubFillRef = useRef<HTMLDivElement>(null)
  const scrubPercentRef = useRef<HTMLSpanElement>(null)
  const localPercentRef = useRef<HTMLSpanElement>(null)
  const architectureAnnotationRef = useRef<HTMLDivElement>(null)

  const [activeWpId, setActiveWpId] = useState<CameraStateId>('ARRIVAL')
  const exploded = useExplodedState()
  const activeComponent =
    (exploded.selectedId && COMPONENT_MAP.get(exploded.selectedId)) ||
    (exploded.hoveredId && COMPONENT_MAP.get(exploded.hoveredId)) ||
    null

  useEffect(() => {
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      const proxy = { progress: 0 }
      let lastActiveId: CameraStateId = 'ARRIVAL'

      // Master timeline scrubbed by ScrollTrigger
      const tl = gsap.timeline({ paused: true })
      tl.to(proxy, {
        progress: 1.0,
        duration: 1.0,
        ease: 'none',
        onUpdate: () => {
          const prog = proxy.progress
          setChoreographyProgress(prog)

          // Sample waypoint data
          const { activeWaypoint, localProgress } = sampleChoreography(prog, tempPos, tempTarget)

          // Update direct DOM elements for zero-re-render compositor performance
          if (waypointTagRef.current) {
            waypointTagRef.current.textContent = `${activeWaypoint.chapter} // ${activeWaypoint.id}`
          }
          if (waypointHeadingRef.current) {
            waypointHeadingRef.current.textContent = activeWaypoint.title
          }
          if (waypointDescRef.current) {
            waypointDescRef.current.textContent = activeWaypoint.description
          }
          if (scrubFillRef.current) {
            scrubFillRef.current.style.width = `${(prog * 100).toFixed(1)}%`
          }
          if (scrubPercentRef.current) {
            scrubPercentRef.current.textContent = `${Math.round(prog * 100)}%`
          }
          if (localPercentRef.current) {
            localPercentRef.current.textContent = `${Math.round(localProgress * 100)}%`
          }

          // Step 19: DOM + 3D + Shader Synchronization in Architecture scene (Requirement 14)
          if (architectureAnnotationRef.current) {
            const isArch = activeWaypoint.id === 'ARCHITECTURE'
            architectureAnnotationRef.current.style.opacity = isArch ? '1' : '0'
            architectureAnnotationRef.current.style.transform = isArch ? 'translateY(0)' : 'translateY(8px)'
            if (isArch) {
              const textEl = architectureAnnotationRef.current.querySelector('.three-arch-val')
              if (textEl) {
                textEl.textContent = `${(localProgress * 100).toFixed(0)}%`
              }
            }
          }

          // Step 19: Authoritative write to Unified Motion State
          const currentVel = scrollTriggerInstance.current ? scrollTriggerInstance.current.getVelocity() / 1000 : 0
          const currentDir = scrollTriggerInstance.current ? (scrollTriggerInstance.current.direction as -1 | 0 | 1) : 0
          setScrollMotion(prog, currentVel, currentDir)

          // Update active button state only on transition boundaries
          if (activeWaypoint.id !== lastActiveId) {
            lastActiveId = activeWaypoint.id
            setActiveWpId(activeWaypoint.id)
          }
        },
      })

      // Pinned ScrollTrigger setup (Requirement 7)
      const st = ScrollTrigger.create({
        trigger: pinWrapperRef.current,
        start: 'top top',
        end: '+=250%', // 2.5 screen-heights of pinned continuous scroll
        pin: stickyContentRef.current,
        scrub: 0.3,   // Responsive physical damping matching Lenis virtual scroll
        animation: tl,
        id: 'three-stage-choreography-pin',
        anticipatePin: 1,
        onUpdate: (self) => {
          setMechanicalVelocity(self.getVelocity() / 1000)
        },
      })

      scrollTriggerInstance.current = st
    }, pinWrapperRef)

    return () => {
      ctx.revert()
    }
  }, [])

  // Controlled GSAP / Lenis jump to specific waypoint (Requirement 14)
  const handleWaypointClick = (wpStart: number) => {
    const st = scrollTriggerInstance.current
    if (!st) return

    // Calculate absolute page scroll position corresponding to this waypoint
    const targetScroll = st.start + wpStart * (st.end - st.start)
    scrollToTarget(targetScroll, { duration: 1.4 })
  }

  return (
    <section
      id="engineering-3d"
      className="three-stage-section"
      aria-label="Cinematic 3D Camera Choreography Stage"
    >
      <div ref={pinWrapperRef} className="three-stage-pin-wrapper">
        <div ref={stickyContentRef} className="three-stage-sticky-content">
          <div className="container">
            {/* Stage Technical Header */}
            <div className="three-stage__header">
              <span className="type-label three-stage__label motion-label" tabIndex={0}>
                Camera Choreography // Archive 05
              </span>
              <h2 className="type-heading-1 three-stage__title">
                Powertrain Spatial Choreography
              </h2>
              <p className="type-body three-stage__intro">
                A continuous, scroll-driven multi-waypoint camera journey through the 2003 Honda Accord
                powertrain architecture. Scroll scrubs through 8 cinematic focal chapters with coordinated
                component separation and real-time pointer look-around.
              </p>
            </div>

            <div className="three-stage__grid">
              {/* Main 3D Viewport hosted with React Three Fiber + Drei */}
              <div className="three-stage__viewport-container">
                <Accord3DCanvas interactive showHUD />
              </div>

              {/* Technical Specifications & Waypoint Sequence Sidebar */}
              <aside className="three-stage__sidebar" aria-label="Camera Waypoint Sequence">
                {/* Step 9 Exploded View Interactive Toggle (Requirement 15) */}
                <button
                  type="button"
                  className={`three-stage__explode-toggle ${
                    exploded.isExploded ? 'three-stage__explode-toggle--active' : ''
                  }`}
                  onClick={() => toggleExplodedState()}
                  aria-pressed={exploded.isExploded}
                  aria-label="Toggle Exploded Engineering View"
                >
                  <span className="three-stage__explode-icon">⚙</span>
                  <span className="three-stage__explode-text">
                    {exploded.isExploded ? 'ASSEMBLED ARCHITECTURE' : 'EXPLORE SYSTEMS'}
                  </span>
                  <span className="three-stage__explode-badge">
                    {Math.round(exploded.progress * 100)}%
                  </span>
                </button>

                {/* Step 9 Active Component Detail Card (Requirement 17) */}
                {activeComponent && (
                  <div className="three-stage__component-inspector">
                    <div className="three-stage__inspector-header">
                      <span className="three-stage__inspector-tag">
                        {activeComponent.category} // ARCHIVE
                      </span>
                      <button
                        type="button"
                        className="three-stage__inspector-close"
                        onClick={() => selectExplodedComponent(null)}
                        title="Deselect component"
                        aria-label="Deselect component"
                      >
                        ✕
                      </button>
                    </div>
                    <h4 className="three-stage__inspector-title">{activeComponent.label}</h4>
                    <p className="three-stage__inspector-desc">{activeComponent.description}</p>
                    {activeComponent.specs && (
                      <div className="three-stage__inspector-specs">
                        {activeComponent.specs.map((spec, idx) => (
                          <div key={idx} className="three-stage__spec-item">
                            <span className="three-stage__spec-k">{spec.label}</span>
                            <span className="three-stage__spec-v">{spec.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="three-stage__step-card">
                  <span ref={waypointTagRef} className="three-stage__step-tag">
                    CH-01 // ARRIVAL
                  </span>
                  <h3 ref={waypointHeadingRef} className="three-stage__step-heading">
                    ARRIVAL & AWAKENING
                  </h3>
                  <p ref={waypointDescRef} className="three-stage__step-desc">
                    Wide establishing vantage. Assembly is small within the dark studio with large negative space.
                  </p>

                  {/* Step 19: Synchronized Architecture Scene Technical Badge */}
                  <div
                    ref={architectureAnnotationRef}
                    className="three-stage__arch-annotation"
                    style={{
                      opacity: 0,
                      transform: 'translateY(8px)',
                      transition: 'opacity 0.25s ease, transform 0.25s ease',
                      marginTop: '0.65rem',
                      padding: '0.45rem 0.65rem',
                      background: 'rgba(200, 16, 46, 0.08)',
                      border: '1px solid rgba(200, 16, 46, 0.35)',
                      borderRadius: '2px',
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      color: 'var(--color-accent-red)',
                    }}
                  >
                    <span>⚡ ARCHITECTURE SYNCHRONIZATION // DATUM CARRIER FLANGE</span>
                    <div style={{ marginTop: '2px', color: 'var(--color-text-secondary)' }}>
                      LOCAL INSPECTION: <strong className="three-arch-val" style={{ color: 'var(--color-text-primary)' }}>0%</strong> | GLSL PARTING ACCENT: <strong style={{ color: 'var(--color-accent-red)' }}>ACTIVE</strong>
                    </div>
                  </div>
                </div>

                {/* Accessible Subsystems List (Requirement 22 & 23) */}
                <div className="three-stage__subsystems">
                  <span className="three-stage__subsystems-label">ENGINEERING SUBSYSTEMS</span>
                  <div className="three-stage__subsystems-grid" role="tablist" aria-label="Engineering Subsystems">
                    {ENGINEERING_COMPONENTS.map((comp) => (
                      <button
                        key={comp.id}
                        type="button"
                        role="tab"
                        aria-selected={exploded.selectedId === comp.id}
                        className={`three-stage__comp-btn ${
                          exploded.selectedId === comp.id ? 'three-stage__comp-btn--selected' : ''
                        }`}
                        onClick={() =>
                          selectExplodedComponent(exploded.selectedId === comp.id ? null : comp.id)
                        }
                      >
                        {comp.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Waypoint Navigator List */}
                <div className="three-stage__waypoint-nav">
                  <span className="three-stage__nav-label">CINEMATIC CHAPTER WAYPOINTS</span>
                  <div className="three-stage__waypoint-list">
                    {CAMERA_WAYPOINTS.map((wp) => (
                      <button
                        key={wp.id}
                        type="button"
                        className={`three-stage__waypoint-btn ${
                          activeWpId === wp.id ? 'three-stage__waypoint-btn--active' : ''
                        }`}
                        onClick={() => handleWaypointClick(wp.range.start)}
                        title={`Navigate to ${wp.title}`}
                      >
                        <span>{wp.id}</span>
                        <div className="three-stage__waypoint-indicator" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scrub Progress Gauges */}
                <div className="three-stage__scrub-guide">
                  <div className="three-stage__scrub-row">
                    <span>GLOBAL PROGRESS:</span>
                    <span ref={scrubPercentRef} className="three-stage__scrub-percent">
                      0%
                    </span>
                  </div>
                  <div className="three-stage__scrub-indicator">
                    <div className="three-stage__scrub-bar">
                      <div ref={scrubFillRef} className="three-stage__scrub-fill" />
                    </div>
                  </div>

                  <div className="three-stage__scrub-row" style={{ marginTop: '0.4rem' }}>
                    <span>LOCAL CHAPTER PROGRESS:</span>
                    <strong ref={localPercentRef} style={{ color: 'var(--color-accent)' }}>
                      0%
                    </strong>
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
