import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { AccordScene } from './AccordScene'
import { isWebGLAvailable } from './renderer'
import { setThreeInactive, registerThreeDOMBindings } from './telemetry'
import { ThreeErrorBoundary } from './ThreeErrorBoundary'
import { getQualityConfig } from './qualityTiers'
import './ThreeScene.css'

export interface Accord3DCanvasProps {
  interactive?: boolean
  showHUD?: boolean
  className?: string
}

/**
 * ----------------------------------------------------------------------------
 * ACCORD 3D CANVAS (Step 15 — 3D Choreography)
 * ----------------------------------------------------------------------------
 * The primary entry point hosting the React Three Fiber <Canvas> pipeline:
 *
 * 1. Hardware Check:
 *    Detects WebGL context support. If unavailable, renders the accessible
 *    high-precision 2D CAD blueprint schematic fallback.
 * 2. Canvas Configuration:
 *    - Clamped DPR: dpr={[1, 2]}
 *    - Photorealistic tone mapping: ACESFilmicToneMapping
 *    - Power preference: high-performance
 *    - Transparent background: alpha={true}
 * 3. CAD HUD Overlay:
 *    Renders technical corner brackets, live cinematic waypoint badge,
 *    camera lookAt coordinates, and local progress gauge.
 */
export function Accord3DCanvas({
  interactive = true,
  showHUD = true,
  className = '',
}: Accord3DCanvasProps) {
  const [webGLSupported] = useState<boolean>(() => isWebGLAvailable())

  // Direct DOM refs for CAD HUD overlay readouts
  const hudWaypointRef = useRef<HTMLSpanElement>(null)
  const hudGlobalProgRef = useRef<HTMLSpanElement>(null)
  const hudLocalProgRef = useRef<HTMLSpanElement>(null)
  const hudCamPosRef = useRef<HTMLSpanElement>(null)
  const hudTargetRef = useRef<HTMLSpanElement>(null)
  const hudDprRef = useRef<HTMLSpanElement>(null)
  const hudValveLiftRef = useRef<HTMLSpanElement>(null)
  const hudExplodedRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    // Bind local CAD HUD readout elements directly to the telemetry store
    const unbind = registerThreeDOMBindings({
      waypointEl: hudWaypointRef.current,
      globalProgEl: hudGlobalProgRef.current,
      localProgEl: hudLocalProgRef.current,
      cameraPosEl: hudCamPosRef.current,
      cameraTargetEl: hudTargetRef.current,
      pixelRatioEl: hudDprRef.current,
      valveLiftEl: hudValveLiftRef.current,
      explodedProgressEl: hudExplodedRef.current,
    })

    return () => {
      unbind()
      setThreeInactive()
    }
  }, [])

  // Accessible Fallback for clients without WebGL hardware acceleration
  if (!webGLSupported) {
    return (
      <div
        className={`three-scene-wrapper ${className}`}
        role="region"
        aria-label="3D Engineering Assembly Fallback"
      >
        <div className="three-fallback">
          <svg
            className="three-fallback-cad"
            viewBox="0 0 600 360"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <pattern id="cadGridFallbackR3F" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(42, 49, 58, 0.35)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="600" height="360" fill="url(#cadGridFallbackR3F)" />

            <rect x="120" y="160" width="360" height="110" rx="4" stroke="rgba(140, 148, 158, 0.85)" strokeWidth="1.5" fill="rgba(36, 40, 48, 0.6)" />
            <line x1="80" y1="215" x2="520" y2="215" stroke="rgba(200, 16, 46, 0.5)" strokeWidth="1" strokeDasharray="6 4" />

            <rect x="80" y="125" width="440" height="24" rx="2" stroke="rgba(180, 190, 200, 0.9)" strokeWidth="1.5" fill="rgba(140, 148, 158, 0.4)" />
            <circle cx="140" cy="137" r="38" stroke="rgba(200, 16, 46, 0.85)" strokeWidth="1.5" fill="rgba(28, 31, 36, 0.7)" />
            <circle cx="140" cy="137" r="28" stroke="rgba(140, 148, 158, 0.6)" strokeWidth="1" strokeDasharray="3 3" />

            <path d="M 270 115 Q 285 92 300 115 L 300 149 Q 285 155 270 149 Z" stroke="rgba(240, 240, 245, 0.9)" strokeWidth="1.5" fill="rgba(180, 190, 200, 0.5)" />
            <path d="M 370 159 Q 385 182 400 159 L 400 125 Q 385 119 370 125 Z" stroke="rgba(240, 240, 245, 0.9)" strokeWidth="1.5" fill="rgba(180, 190, 200, 0.5)" />

            <rect x="278" y="55" width="14" height="60" stroke="rgba(88, 96, 108, 0.9)" strokeWidth="1.5" fill="rgba(88, 96, 108, 0.3)" />
            <rect x="378" y="55" width="14" height="60" stroke="rgba(88, 96, 108, 0.9)" strokeWidth="1.5" fill="rgba(88, 96, 108, 0.3)" />

            <circle cx="140" cy="137" r="3" fill="#c8102e" />
            <line x1="140" y1="90" x2="140" y2="184" stroke="rgba(200, 16, 46, 0.4)" strokeWidth="0.75" />
            <text x="148" y="85" fill="#8c949e" fontSize="10" fontFamily="monospace">REF: TIMING SPROCKET // Ø76mm</text>
            <text x="285" y="45" fill="#8c949e" fontSize="10" fontFamily="monospace">INTAKE VALVE GUIDE [L1]</text>
            <text x="385" y="45" fill="#8c949e" fontSize="10" fontFamily="monospace">EXHAUST VALVE GUIDE [L2]</text>
            <text x="125" y="295" fill="#58606c" fontSize="9" fontFamily="monospace">SUBFRAME MOUNTING CRADLE // HIGH-TENSILE STEEL</text>
          </svg>
          <div className="three-fallback-meta">
            <span className="three-fallback-badge">STATIC CAD SCHEMATIC MODE</span>
            <p className="three-fallback-desc">
              Hardware WebGL acceleration is currently inactive. Rendering precision 2D engineering blueprint representation of the J30A4 V6 camshaft assembly.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const quality = getQualityConfig()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isInViewport, setIsInViewport] = useState(true)

  // WebGL Performance Throttling: Pause frameloop when scrolled out of view
  useEffect(() => {
    const el = wrapperRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting)
      },
      { rootMargin: '250px 0px 250px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={wrapperRef}
      className={`three-scene-wrapper ${className}`}
      role="region"
      aria-label="Interactive 3D mechanical CAD assembly study of the 2003 Honda Accord powertrain architecture"
    >
      <ThreeErrorBoundary>
        <Canvas
          shadows
          frameloop={isInViewport ? 'always' : 'demand'}
          gl={{
            antialias: quality.antialiasing,
            alpha: true,
            powerPreference: quality.powerPreference,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          dpr={quality.dpr}
          className="three-scene-canvas"
        >
          <AccordScene interactive={interactive} />
        </Canvas>
      </ThreeErrorBoundary>

      {showHUD && (
        <div className="three-scene-hud" aria-hidden="true">
          {/* Viewport Corner Brackets */}
          <div className="three-hud-corner three-hud-corner--tl" />
          <div className="three-hud-corner three-hud-corner--tr" />
          <div className="three-hud-corner three-hud-corner--bl" />
          <div className="three-hud-corner three-hud-corner--br" />

          {/* Top Telemetry Header */}
          <div className="three-hud-top">
            <div className="three-hud-badge">
              <div className="three-hud-badge-dot" />
              <span>CHOREOGRAPHY // </span>
              <strong ref={hudWaypointRef} style={{ color: 'var(--color-accent-red)' }}>ARRIVAL</strong>
            </div>
            <div className="three-hud-badge">
              <span>LOCAL: </span>
              <span ref={hudLocalProgRef} style={{ color: 'var(--color-accent)', minWidth: '38px' }}>0.0%</span>
              <span style={{ margin: '0 4px', opacity: 0.4 }}>|</span>
              <span>DPR: </span>
              <span ref={hudDprRef}>1.0x</span>
            </div>
          </div>

          {/* Bottom Telemetry Bar */}
          <div className="three-hud-bottom">
            <div className="three-hud-metrics">
              <div className="three-hud-metric-item">
                <span className="three-hud-metric-label">EYE:</span>
                <span ref={hudCamPosRef} className="three-hud-metric-value">[5.2, 3.2, 6.4]</span>
              </div>
              <div className="three-hud-metric-item">
                <span className="three-hud-metric-label">TARGET:</span>
                <span ref={hudTargetRef} className="three-hud-metric-value">[0.0, 0.0, 0.0]</span>
              </div>
              <div className="three-hud-metric-item">
                <span className="three-hud-metric-label">STAGE:</span>
                <span ref={hudGlobalProgRef} className="three-hud-metric-value">0.0%</span>
              </div>
              <div className="three-hud-metric-item">
                <span className="three-hud-metric-label">LIFT:</span>
                <span ref={hudValveLiftRef} className="three-hud-metric-value">0.00 mm</span>
              </div>
              <div className="three-hud-metric-item">
                <span className="three-hud-metric-label">MODE:</span>
                <span ref={hudExplodedRef} className="three-hud-metric-value">ASSEMBLED</span>
              </div>
            </div>
            <div className="three-hud-instruction">
              VALVETRAIN KINEMATICS • 1:2 GEAR RATIO • PROCEDURAL PHYSICS
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
