import { useMemo, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import {
  ATMOSPHERE_VERTEX_SHADER,
  ATMOSPHERE_FRAGMENT_SHADER,
  createAtmosphereUniforms,
} from './atmosphereShaders'
import { getUnifiedMotionState } from '../../motion/unifiedMotion'
import { sampleStudioLightingState } from '../lighting/lightingStates'
import { prefersReducedMotion } from '../../animation/gsapConfig'
import { getQualityConfig } from '../qualityTiers'
import { dampDt } from '../../motion/lerp'
import { getMotionBridgeState } from '../motionBridge'
import { getEnvironmentState } from '../environment/environmentStore'

/**
 * ----------------------------------------------------------------------------
 * CINEMATIC ATMOSPHERE COMPONENT (Step 8 — WebGL / GLSL Cinematic Atmosphere)
 * ----------------------------------------------------------------------------
 * A curved studio cyclorama scrim enveloping the rear and flanks of the
 * 2003 Honda Accord engineering scene.
 *
 * Provides:
 * - Spatial depth and soft optical softbox illumination.
 * - Subtly modulated chromatic temperatures matching Step 7's 5 lighting states.
 * - Gentle pointer parallax displacement (perspective shift without cursor chasing).
 * - Velocity momentum expansion during rapid navigation.
 * - Complete accessibility and mobile quality scaling.
 */

export interface CinematicAtmosphereProps {
  intensity?: number
  visible?: boolean
}

export function CinematicAtmosphere({
  intensity = 0.85,
  visible = true,
}: CinematicAtmosphereProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const size = useThree((state) => state.size)
  const quality = useMemo(() => getQualityConfig(), [])

  // Pre-allocated runtime color targets (ZERO allocation in useFrame)
  const cKey = useMemo(() => new THREE.Color(), [])
  const cRim = useMemo(() => new THREE.Color(), [])
  const cAmb = useMemo(() => new THREE.Color(), [])
  const vKeyPos = useMemo(() => new THREE.Vector3(), [])

  // Live smoothed pointer coordinates
  const smoothedPointer = useRef(new THREE.Vector2(0, 0))

  // 1. Create ShaderMaterial and Uniforms container
  const { material, uniforms } = useMemo(() => {
    const u = createAtmosphereUniforms({
      intensity,
      noiseScale: quality.tier === 'LOW' ? 1.5 : 2.8,
      falloffRadius: 1.25,
    })
    const mat = new THREE.ShaderMaterial({
      vertexShader: ATMOSPHERE_VERTEX_SHADER,
      fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
      uniforms: u as unknown as { [uniform: string]: THREE.IUniform },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.BackSide,
      blending: THREE.NormalBlending,
    })
    return { material: mat, uniforms: u }
  }, [intensity, quality.tier])

  // 2. Create Curved Studio Cyclorama Scrim Geometry
  const geometry = useMemo(() => {
    // 15m radius, 14m height open-ended cylinder arc wrapping 270 degrees
    return new THREE.CylinderGeometry(15, 15, 14, 32, 1, true, Math.PI * 0.75, Math.PI * 1.5)
  }, [])

  // 3. Resource Cleanup on Unmount
  useEffect(() => {
    return () => {
      material.dispose()
      geometry.dispose()
    }
  }, [material, geometry])

  // 4. Zero-Allocation High-Frequency Update Loop
  useFrame((_, delta) => {
    if (!visible) return

    const dt = Math.min(Math.max(delta, 0.001), 0.1)
    const isReduced = prefersReducedMotion()
    const motion = getUnifiedMotionState()

    // A. Time uniform (Slow, imperceptible drift; frozen if reduced-motion)
    if (!isReduced) {
      uniforms.uTime.value += dt * 0.08
    }

    // B. Viewport Resolution
    uniforms.uResolution.value.set(size.width, size.height)

    // C. Scroll Progress [0.0, 1.0]
    uniforms.uProgress.value = motion.progress

    // D. Damped Pointer Parallax
    if (!isReduced && !motion.isTouch) {
      const lambda = 6.5
      smoothedPointer.current.x = dampDt(smoothedPointer.current.x, motion.smoothedNX, lambda, dt)
      smoothedPointer.current.y = dampDt(smoothedPointer.current.y, motion.smoothedNY, lambda, dt)
      uniforms.uPointer.value.copy(smoothedPointer.current)
    } else {
      uniforms.uPointer.value.set(0, 0)
    }

    // E. Velocity Momentum
    uniforms.uVelocity.value = isReduced ? 0 : motion.normalizedVelocity

    // E2. Step 10 & 11: Attenuate exterior scrim when inside cabin or on the road
    const interiorProg = getMotionBridgeState().interiorProgress
    const roadProg = getMotionBridgeState().roadProgress
    let scrimFade = 1.0
    if (roadProg > 0.001) {
      scrimFade = Math.max(0.15, 1.0 - roadProg * 0.75)
    } else if (interiorProg > 0.1) {
      scrimFade = Math.max(0.25, 1.0 - interiorProg * 0.65)
    }
    uniforms.uIntensity.value = intensity * scrimFade

    // F. Synchronize with Step 7 Lighting States
    const { stateA, stateB, alpha } = sampleStudioLightingState(motion.progress)

    // Interpolate Key Light Position
    vKeyPos.set(
      stateA.keyPosition[0] + (stateB.keyPosition[0] - stateA.keyPosition[0]) * alpha,
      stateA.keyPosition[1] + (stateB.keyPosition[1] - stateA.keyPosition[1]) * alpha,
      stateA.keyPosition[2] + (stateB.keyPosition[2] - stateA.keyPosition[2]) * alpha
    )
    uniforms.uKeyLightPos.value.copy(vKeyPos)

    // Interpolate Light Colors
    cKey.set(stateA.keyColor).lerp(cRim.set(stateB.keyColor), alpha)
    uniforms.uKeyLightColor.value.copy(cKey)

    cRim.set(stateA.rimColor).lerp(cAmb.set(stateB.rimColor), alpha)
    uniforms.uRimLightColor.value.copy(cRim)

    cAmb.set(stateA.ambientColor).lerp(cKey.set(stateB.ambientColor), alpha)

    // Step 12: Sync horizon ambient tone with continuous environment sky horizon
    if (roadProg > 0.001) {
      const env = getEnvironmentState()
      cKey.set(env.skyHorizonColor)
      cAmb.lerp(cKey, Math.min(roadProg * 1.5, 0.85))
    }
    uniforms.uAmbientColor.value.copy(cAmb)
  })

  if (!visible) return null

  return (
    <mesh
      ref={meshRef}
      name="CINEMATIC_STUDIO_ATMOSPHERE_SCRIM"
      position={[0, 3.2, 0]}
      geometry={geometry}
      material={material}
      renderOrder={-1}
    />
  )
}
