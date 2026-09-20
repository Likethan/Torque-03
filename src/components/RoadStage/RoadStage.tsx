import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'
import { Accord3DCanvas } from '../../three/Accord3DCanvas'
import {
  setRoadMotionProgress,
  setCameraModeState,
  updateEnvironmentMotionState,
} from '../../three/motionBridge'
import {
  setRoadStoreProgress,
  ROAD_CAMERA_SHOTS,
  sampleRoadChoreography,
  getRoadLength,
} from '../../three/road'
import {
  updateEnvironmentFromProgress,
  getEnvironmentState,
} from '../../three/environment'
import { setScrollMotion } from '../../motion/unifiedMotion'
import { scrollToTarget } from '../../motion/lenisManager'
import { prefersReducedMotion } from '../../animation/gsapConfig'
import {
  updateRoadTelemetry,
  updateEnvironmentTelemetry,
} from '../../three/telemetry'
import './RoadStage.css'

gsap.registerPlugin(ScrollTrigger)

// Static vectors for sampling
const tempPos = new THREE.Vector3()
const tempTarget = new THREE.Vector3()

/**
 * ----------------------------------------------------------------------------
 * ROAD CINEMATIC STAGE (Step 11 — Driving / Road Cinematic Sequence)
 * ----------------------------------------------------------------------------
 * Pinned scroll-driven section orchestrating the automotive driving sequence:
 *
 * SCROLL POSITION (Lenis inertial scroll)
 *       ↓
 * ROAD PROGRESS (0.000 → 1.000 via ScrollTrigger pin track, +=350% travel)
 *       ↓
 * VEHICLE POSITION & SPLINE BASIS (450m Catmull-Rom highway path)
 *       ↓
 * 8 DIRECTED CINEMATIC CAMERA SHOTS (Cockpit Departure → Hero Hold)
 *       ↓
 * 4 WHEEL ROTATION & SUSPENSION DYNAMICS (Distance-synchronized)
 *       ↓
 * 3D RENDER (shared Accord3DCanvas R3F pipeline)
 */
export function RoadStage() {
  const pinWrapperRef = useRef<HTMLDivElement>(null)
  const stickyContentRef = useRef<HTMLDivElement>(null)
  const scrollTriggerInstance = useRef<ScrollTrigger | null>(null)

  // Direct DOM refs for high-frequency telemetry & kinetic typography (zero React re-renders)
  const phaseTagRef = useRef<HTMLSpanElement>(null)
  const phaseHeadingRef = useRef<HTMLHeadingElement>(null)
  const phaseDescRef = useRef<HTMLParagraphElement>(null)
  const editorialBannerRef = useRef<HTMLDivElement>(null)
  const editorialTextRef = useRef<HTMLSpanElement>(null)
  const speedReadoutRef = useRef<HTMLSpanElement>(null)
  const distanceReadoutRef = useRef<HTMLSpanElement>(null)
  const scrubFillRef = useRef<HTMLDivElement>(null)
  const scrubPercentRef = useRef<HTMLSpanElement>(null)

  // Step 12 Weather & Environment DOM readouts
  const weatherBadgeRef = useRef<HTMLSpanElement>(null)
  const weatherTimeRef = useRef<HTMLSpanElement>(null)
  const weatherWetRef = useRef<HTMLSpanElement>(null)
  const weatherRainRef = useRef<HTMLSpanElement>(null)

  const [activePhaseId, setActivePhaseId] = useState<string>('ROAD_DEPARTURE')

  useEffect(() => {
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      const proxy = { progress: 0 }
      let lastPhaseId = ''
      const roadLength = getRoadLength()

      const tl = gsap.timeline({ paused: true })
      tl.to(proxy, {
        progress: 1.0,
        duration: 1.0,
        ease: 'none',
        onUpdate: () => {
          const prog = proxy.progress
          const st = scrollTriggerInstance.current
          const rawVel = st ? Math.abs(st.getVelocity() / 1000) : 0
          const scrollDir = st ? (st.direction as -1 | 0 | 1) : 0

          // Calculate distance traveled along 450m spline
          const distanceMeters = prog * roadLength

          // Calculate cinematic speed in km/h based on scroll velocity + phase cruising curve
          // Cruising profile: ramps up in phases 2-4, peaks in phase 5, decelerates in 7-8
          let phaseBaseSpeed = 0
          if (prog < 0.12) phaseBaseSpeed = prog * 280 // 0 -> ~34 km/h departure
          else if (prog < 0.38) phaseBaseSpeed = 34 + (prog - 0.12) * 230 // 34 -> ~94 km/h acceleration
          else if (prog < 0.66) phaseBaseSpeed = 94 + Math.sin((prog - 0.38) * 11.2) * 18 // ~94-112 km/h cruising
          else if (prog < 0.92) phaseBaseSpeed = Math.max(94 - (prog - 0.66) * 310, 15) // deceleration
          else phaseBaseSpeed = Math.max(15 - (prog - 0.92) * 180, 0) // final stop

          // Modulate with active scroll velocity
          const velocityInfluence = Math.min(rawVel * 18, 45)
          const liveSpeedKmh = Math.min(phaseBaseSpeed + velocityInfluence, 135)

          // 1. Update motion bridge (consumed by CameraRig, RoadVehicle, RoadEnvironment, Lighting)
          setRoadMotionProgress(prog, liveSpeedKmh, distanceMeters)
          setCameraModeState('ROAD')

          // 2. Sample road camera choreography
          const choreography = sampleRoadChoreography(prog, tempPos, tempTarget)
          const activeShot = choreography.activeShot

          // 3. Update reactive store
          const shotIndex = ROAD_CAMERA_SHOTS.findIndex((s) => s.id === activeShot.id)
          setRoadStoreProgress(prog, activeShot.id, shotIndex, liveSpeedKmh, distanceMeters)

          // 4. Update high-frequency telemetry store
          updateRoadTelemetry(
            prog,
            `${activeShot.phase} // ${activeShot.title}`,
            liveSpeedKmh,
            distanceMeters
          )

          // 5. Update direct DOM elements
          if (phaseTagRef.current) {
            phaseTagRef.current.textContent = `${activeShot.phase} // ${activeShot.id}`
          }
          if (phaseHeadingRef.current) {
            phaseHeadingRef.current.textContent = activeShot.title
          }
          if (phaseDescRef.current) {
            phaseDescRef.current.textContent = activeShot.description
          }
          if (speedReadoutRef.current) {
            speedReadoutRef.current.textContent = `${Math.round(liveSpeedKmh)} KM/H`
          }
          if (distanceReadoutRef.current) {
            distanceReadoutRef.current.textContent = `${Math.round(distanceMeters)} M`
          }
          if (scrubFillRef.current) {
            scrubFillRef.current.style.width = `${(prog * 100).toFixed(1)}%`
          }
          if (scrubPercentRef.current) {
            scrubPercentRef.current.textContent = `${Math.round(prog * 100)}%`
          }

          // Step 12: Update Environmental Interaction & Weather
          updateEnvironmentFromProgress(prog)
          const env = getEnvironmentState()
          updateEnvironmentMotionState(
            env.weatherState,
            env.timeOfDay,
            env.rainIntensity,
            env.roadWetness,
            env.windIntensity,
            env.fogIntensity
          )
          updateEnvironmentTelemetry(
            env.weatherState,
            env.timeOfDay,
            env.rainIntensity,
            env.roadWetness,
            env.windIntensity,
            env.fogIntensity
          )

          if (weatherBadgeRef.current) {
            weatherBadgeRef.current.textContent = `${env.weatherState}`
          }
          if (weatherTimeRef.current) {
            weatherTimeRef.current.textContent = env.timeOfDay.replace('_', ' ')
          }
          if (weatherWetRef.current) {
            weatherWetRef.current.textContent =
              env.roadWetness > 0.4 ? 'WET' : env.roadWetness > 0.08 ? 'DAMP' : 'DRY'
          }
          if (weatherRainRef.current) {
            weatherRainRef.current.textContent = `${Math.round(env.rainIntensity * 100)}%`
          }

          // Editorial kinetic typography banner overlay
          if (editorialBannerRef.current && editorialTextRef.current) {
            if (activeShot.editorialTag) {
              editorialTextRef.current.textContent = activeShot.editorialTag
              editorialBannerRef.current.style.opacity = '1'
            } else {
              editorialBannerRef.current.style.opacity = '0'
            }
          }

          // Unified motion sync
          setScrollMotion(prog, rawVel, scrollDir)

          // Trigger React phase change only on discrete shot boundary
          if (activeShot.id !== lastPhaseId) {
            lastPhaseId = activeShot.id
            setActivePhaseId(activeShot.id)
          }
        },
      })

      const st = ScrollTrigger.create({
        trigger: pinWrapperRef.current,
        start: 'top top',
        end: '+=350%', // 3.5 screen-heights for generous, cinematic travel
        pin: stickyContentRef.current,
        scrub: 0.3,
        animation: tl,
        id: 'road-stage-choreography-pin',
        anticipatePin: 1,
      })

      scrollTriggerInstance.current = st
    }, pinWrapperRef)

    return () => {
      ctx.revert()
    }
  }, [])

  const handlePhaseClick = (shotStart: number) => {
    const st = scrollTriggerInstance.current
    if (!st) return
    const targetScroll = st.start + shotStart * (st.end - st.start)
    scrollToTarget(targetScroll, { duration: 1.5 })
  }

  return (
    <section
      id="road-cinematic"
      className="road-stage-section"
      aria-label="Driving Road Cinematic Sequence"
    >
      <div ref={pinWrapperRef} className="road-stage-pin-wrapper">
        <div ref={stickyContentRef} className="road-stage-sticky-content">
          <div className="container">
            {/* Stage Header */}
            <div className="road-stage__header">
              <span className="type-label road-stage__label motion-label" tabIndex={0}>
                Road Motion // Step 11
              </span>
              <h2 className="type-heading-1 road-stage__title">
                Machine in Motion
              </h2>
              <p className="type-body road-stage__intro">
                A continuous, spline-driven highway cinematic capturing the 2003 Honda Accord
                in motion. The vehicle navigates a 450-meter highway path through 8 directed
                cinematic camera perspectives, with synchronized wheel rotation and suspension dynamics.
              </p>
            </div>

            <div className="road-stage__grid">
              {/* 3D Viewport — Reusing shared Accord3DCanvas */}
              <div className="road-stage__viewport-container">
                <Accord3DCanvas interactive showHUD />

                {/* Editorial Kinetic Typography Overlay */}
                <div ref={editorialBannerRef} className="road-stage__editorial-banner">
                  <span className="road-stage__editorial-kicker">2003 HONDA ACCORD // VTEC V6</span>
                  <span ref={editorialTextRef} className="road-stage__editorial-headline">
                    ENGINEERED FOR THE ROAD
                  </span>
                </div>
              </div>

              {/* Technical Sidebar */}
              <aside className="road-stage__sidebar" aria-label="Road Sequence Telemetry">
                {/* Active Phase Card */}
                <div className="road-stage__phase-card">
                  <span ref={phaseTagRef} className="road-stage__phase-tag">
                    PH-01 // ROAD_DEPARTURE
                  </span>
                  <h3 ref={phaseHeadingRef} className="road-stage__phase-heading">
                    COCKPIT DEPARTURE
                  </h3>
                  <p ref={phaseDescRef} className="road-stage__phase-desc">
                    From within the cockpit, the vehicle initiates forward motion. The horizon expands through the acoustic windshield.
                  </p>
                </div>

                {/* Step 12 Environmental Interaction & Weather Card */}
                <div className="road-stage__weather-card">
                  <div className="road-stage__weather-header">
                    <span className="road-stage__weather-tag">ATMOSPHERE // STEP 12</span>
                    <span ref={weatherBadgeRef} className="road-stage__weather-state">
                      CLEAR
                    </span>
                  </div>
                  <div className="road-stage__weather-metrics">
                    <div className="road-stage__weather-submetric">
                      <span className="road-stage__weather-sublabel">LIGHTING</span>
                      <span ref={weatherTimeRef} className="road-stage__weather-subval">
                        LATE AFTERNOON
                      </span>
                    </div>
                    <div className="road-stage__weather-submetric">
                      <span className="road-stage__weather-sublabel">ASPHALT</span>
                      <span ref={weatherWetRef} className="road-stage__weather-subval">
                        DRY
                      </span>
                    </div>
                    <div className="road-stage__weather-submetric">
                      <span className="road-stage__weather-sublabel">PRECIPITATION</span>
                      <span ref={weatherRainRef} className="road-stage__weather-subval">
                        0%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Metrics Readouts */}
                <div className="road-stage__metrics">
                  <div className="road-stage__metric-card">
                    <span className="road-stage__metric-label">VEHICLE VELOCITY</span>
                    <span ref={speedReadoutRef} className="road-stage__metric-value">
                      0 KM/H
                    </span>
                  </div>
                  <div className="road-stage__metric-card">
                    <span className="road-stage__metric-label">PATH DISTANCE</span>
                    <span ref={distanceReadoutRef} className="road-stage__metric-value">
                      0 M
                    </span>
                  </div>
                </div>

                {/* 8 Cinematic Phase Navigation Buttons */}
                <div className="road-stage__phase-nav">
                  <span className="road-stage__nav-label">CINEMATIC SHOT SEQUENCE</span>
                  <div className="road-stage__phase-list">
                    {ROAD_CAMERA_SHOTS.map((shot) => (
                      <button
                        key={shot.id}
                        type="button"
                        className={`road-stage__phase-btn ${
                          activePhaseId === shot.id ? 'road-stage__phase-btn--active' : ''
                        }`}
                        onClick={() => handlePhaseClick(shot.range.start)}
                        title={`Navigate to ${shot.title}`}
                      >
                        <span>{shot.phase}</span>
                        <div className="road-stage__phase-indicator" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Highway Progress Gauge */}
                <div className="road-stage__scrub-guide">
                  <div className="road-stage__scrub-row">
                    <span>HIGHWAY PROGRESS:</span>
                    <span ref={scrubPercentRef} className="road-stage__scrub-percent">
                      0%
                    </span>
                  </div>
                  <div className="road-stage__scrub-indicator">
                    <div className="road-stage__scrub-bar">
                      <div ref={scrubFillRef} className="road-stage__scrub-fill" />
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
