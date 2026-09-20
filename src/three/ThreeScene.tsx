import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { createStudioScene } from './scene'
import { createStudioCamera, updateCameraAspect } from './camera'
import { createStudioRenderer, isWebGLAvailable, resizeRenderer, disposeRenderer } from './renderer'
import { setupStudioLighting } from './lights'
import { createEngineeringAssembly } from './objects'
import { updateThreeTelemetry, setThreeInactive } from './telemetry'
import { prefersReducedMotion } from '../animation/gsapConfig'
import { getUnifiedMotionState } from '../motion/unifiedMotion'
import { dampDt } from '../motion/lerp'
import './ThreeScene.css'

export interface ThreeSceneHandle {
  scene: THREE.Scene | null
  camera: THREE.PerspectiveCamera | null
  assembly: THREE.Group | null
  renderer: THREE.WebGLRenderer | null
  baseCameraPosition: THREE.Vector3
  targetPosition: THREE.Vector3
}

export interface ThreeSceneProps {
  interactive?: boolean
  showHUD?: boolean
  className?: string
  onSceneReady?: (handle: ThreeSceneHandle) => void
}

/**
 * ----------------------------------------------------------------------------
 * THREESCENE (Step 13 — 3D Foundation)
 * ----------------------------------------------------------------------------
 * Modular React host for the raw Three.js rendering pipeline:
 *
 * 1. Scene Pipeline:
 *    Scene -> Camera -> Objects -> Lights -> Materials -> Renderer -> Canvas
 * 2. Unified RAF Loop:
 *    Hooks into gsap.ticker (no independent requestAnimationFrame loop).
 * 3. Interaction Integration:
 *    Reuses Step 12 centralized interactionStore (smoothedNX/NY) for subtle camera look-around.
 * 4. Zero React State Re-renders on Render Frames:
 *    High-frequency metrics update direct DOM references.
 * 5. Full GPU Cleanup:
 *    Explicit disposal of geometries, materials, and WebGL contexts on unmount.
 * 6. Accessibility & Fallback:
 *    Graceful static blueprint fallback if WebGL is unsupported; respects prefers-reduced-motion.
 */
export const ThreeScene = forwardRef<ThreeSceneHandle, ThreeSceneProps>(
  ({ interactive = true, showHUD = true, className = '', onSceneReady }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Direct DOM refs for HUD telemetry
    const hudCamPosRef = useRef<HTMLSpanElement>(null)
    const hudObjRotRef = useRef<HTMLSpanElement>(null)
    const hudDprRef = useRef<HTMLSpanElement>(null)

    const [webGLSupported, setWebGLSupported] = useState<boolean>(() => isWebGLAvailable())

    // Three.js instance references (persisted across renders without triggering re-renders)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const assemblyRef = useRef<THREE.Group | null>(null)
    const rotatingShaftRef = useRef<THREE.Group | null>(null)

    // Base camera coordinates (controlled by GSAP timelines during scroll scrubbing)
    const baseCameraPosition = useRef<THREE.Vector3>(new THREE.Vector3(3.2, 1.8, 4.2))
    const targetPosition = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0))

    // Expose handle to parent component (e.g. for ScrollTrigger GSAP scrubbing)
    useImperativeHandle(ref, () => ({
      scene: sceneRef.current,
      camera: cameraRef.current,
      assembly: assemblyRef.current,
      renderer: rendererRef.current,
      baseCameraPosition: baseCameraPosition.current,
      targetPosition: targetPosition.current,
    }))

    useEffect(() => {
      // 1. Accessibility & Hardware Check: Test WebGL support
      if (!isWebGLAvailable()) {
        setWebGLSupported(false)
        return
      }

      if (!containerRef.current || !canvasRef.current) return

      let cleanupFn: (() => void) | null = null

      try {
        const container = containerRef.current
        const canvas = canvasRef.current
        const width = container.clientWidth || 800
        const height = container.clientHeight || 500

        // 2. Initialize Three.js Scene Pipeline
        const { scene } = createStudioScene()
        sceneRef.current = scene

        const camera = createStudioCamera(width / height, {
          initialPosition: baseCameraPosition.current,
          target: targetPosition.current,
        })
        cameraRef.current = camera

        const { renderer } = createStudioRenderer(canvas, width, height)
        rendererRef.current = renderer

        // 3. Studio Lighting Rig
        setupStudioLighting(scene)

        // 4. Engineering Assembly Hierarchy
        const assemblyResult = createEngineeringAssembly()
        const { assembly, rotatingShaftGroup, geometries, materials, meshCount } = assemblyResult
        assemblyRef.current = assembly
        rotatingShaftRef.current = rotatingShaftGroup
        scene.add(assembly)

        // Notify parent of ready state
        if (onSceneReady) {
          onSceneReady({
            scene,
            camera,
            assembly,
            renderer,
            baseCameraPosition: baseCameraPosition.current,
            targetPosition: targetPosition.current,
          })
        }

        // Initial render pass
        renderer.render(scene, camera)

        // 5. Responsive Resize Handling with ResizeObserver
        const resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width: newW, height: newH } = entry.contentRect
            if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
              updateCameraAspect(cameraRef.current, newW, newH)
              resizeRenderer(rendererRef.current, newW, newH)
            }
          }
        })
        resizeObserver.observe(container)

        // 6. Unified Render Loop (Bound to GSAP Ticker — No Competing RAFs)
        const onTicker = (_time: number, deltaTime: number) => {
          if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return

          const cam = cameraRef.current
          const assem = assemblyRef.current
          const shaft = rotatingShaftRef.current
          const isReducedMotion = prefersReducedMotion()

          // A. Mechanical Kinematics (Subtle continuous camshaft rotation)
          if (shaft && !isReducedMotion) {
            // Convert deltaTime (ms) to normalized rotational delta (~1.2 rad/sec)
            const dtSeconds = Math.min(deltaTime * 0.001, 0.1)
            shaft.rotation.x += dtSeconds * 1.35
          }

          // B. Step 4 Interaction Response (Subtle Pointer Camera Look-Around with physical mass)
          const dt = Math.min(Math.max(deltaTime * 0.001, 0.001), 0.1)
          if (interactive && !isReducedMotion) {
            const motion = getUnifiedMotionState()
            if (!motion.isTouch) {
              // Subtle, restrained camera parallax (max ±0.35m horizontal, ±0.22m vertical)
              const targetX = baseCameraPosition.current.x + motion.smoothedNX * 0.35
              const targetY = baseCameraPosition.current.y - motion.smoothedNY * 0.22
              const targetZ = baseCameraPosition.current.z

              cam.position.x = dampDt(cam.position.x, targetX, 7.5, dt)
              cam.position.y = dampDt(cam.position.y, targetY, 7.5, dt)
              cam.position.z = dampDt(cam.position.z, targetZ, 7.5, dt)
            } else {
              cam.position.copy(baseCameraPosition.current)
            }
          } else {
            cam.position.copy(baseCameraPosition.current)
          }

          cam.lookAt(targetPosition.current)

          // C. Render Current Frame to Canvas
          renderer.render(scene, cam)

          // D. High-Frequency Telemetry Update (Direct DOM — 0 React Re-renders)
          const curW = container.clientWidth
          const curH = container.clientHeight
          updateThreeTelemetry(
            cam.position.x,
            cam.position.y,
            cam.position.z,
            cam.rotation.x,
            cam.rotation.y,
            cam.rotation.z,
            assem ? assem.rotation.x : 0,
            assem ? assem.rotation.y : 0,
            assem ? assem.rotation.z : 0,
            meshCount,
            renderer.getPixelRatio(),
            curW,
            curH
          )

          // Update local HUD readout elements directly
          if (hudCamPosRef.current) {
            hudCamPosRef.current.textContent = `[${cam.position.x.toFixed(1)}, ${cam.position.y.toFixed(1)}, ${cam.position.z.toFixed(1)}]`
          }
          if (hudObjRotRef.current && assem) {
            hudObjRotRef.current.textContent = `${((assem.rotation.y * 180) / Math.PI).toFixed(1)}°`
          }
          if (hudDprRef.current) {
            hudDprRef.current.textContent = `${renderer.getPixelRatio().toFixed(1)}x`
          }
        }

        // Register with GSAP Ticker
        gsap.ticker.add(onTicker)

        // 7. Cleanup on Unmount (Strict Mode Safe)
        cleanupFn = () => {
          gsap.ticker.remove(onTicker)
          resizeObserver.disconnect()

          // Free GPU geometry buffers
          geometries.forEach((g) => g.dispose())

          // Free GPU materials and shader programs
          materials.forEach((m) => m.dispose())

          // Release WebGL context and clear scene
          disposeRenderer(renderer)
          scene.clear()

          sceneRef.current = null
          cameraRef.current = null
          rendererRef.current = null
          assemblyRef.current = null
          rotatingShaftRef.current = null

          setThreeInactive()
        }
      } catch (err) {
        console.warn('WebGL initialization failed, falling back to CAD schematic mode:', err)
        setWebGLSupported(false)
        setThreeInactive()
      }

      return () => {
        if (cleanupFn) {
          cleanupFn()
        }
      }
    }, [interactive, onSceneReady])

    // Fallback UI when WebGL is unavailable
    if (!webGLSupported) {
      return (
        <div className={`three-scene-wrapper ${className}`} role="region" aria-label="3D Engineering Assembly Fallback">
          <div className="three-fallback">
            <svg
              className="three-fallback-cad"
              viewBox="0 0 600 360"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <pattern id="cadGridFallback" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(42, 49, 58, 0.35)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="600" height="360" fill="url(#cadGridFallback)" />

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

    return (
      <div
        ref={containerRef}
        className={`three-scene-wrapper ${className}`}
        role="region"
        aria-label="Interactive 3D mechanical CAD assembly study of the 2003 Honda Accord powertrain architecture"
      >
        <canvas
          ref={canvasRef}
          className="three-scene-canvas"
          tabIndex={0}
          aria-label="3D viewport showing rotating camshaft and monocoque carrier block"
        />

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
                <span>CAD VIEWPORT // 3D PIPELINE</span>
              </div>
              <div className="three-hud-badge">
                <span>DPR: </span>
                <span ref={hudDprRef}>1.0x</span>
              </div>
            </div>

            {/* Bottom Telemetry Bar */}
            <div className="three-hud-bottom">
              <div className="three-hud-metrics">
                <div className="three-hud-metric-item">
                  <span className="three-hud-metric-label">CAM:</span>
                  <span ref={hudCamPosRef} className="three-hud-metric-value">[3.2, 1.8, 4.2]</span>
                </div>
                <div className="three-hud-metric-item">
                  <span className="three-hud-metric-label">AZIMUTH:</span>
                  <span ref={hudObjRotRef} className="three-hud-metric-value">0.0°</span>
                </div>
              </div>
              <div className="three-hud-instruction">
                POINTER LOOK-AROUND ACTIVE • SCROLL SCRUBS ELEVATION
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

ThreeScene.displayName = 'ThreeScene'
