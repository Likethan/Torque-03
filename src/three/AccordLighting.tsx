import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { getUnifiedMotionState } from '../motion/unifiedMotion'
import { getQualityConfig } from './qualityTiers'
import { prefersReducedMotion } from '../animation/gsapConfig'
import { dampDt } from '../motion/lerp'
import {
  computeStudioLighting,
  createRuntimeLightingValues,
  type RuntimeLightingValues,
} from './lighting/lightingStates'
import { getExplodedState } from './exploded/explodedStore'
import { getMotionBridgeState } from './motionBridge'
import { sampleRoadPoint } from './road/roadSpline'
import { getEnvironmentState } from './environment/environmentStore'
import { getVehicleState } from './vehicle/vehicleStore'
import { computeStudyLightingModifiers } from './vehicle/vehicleLightingController'

/**
 * ----------------------------------------------------------------------------
 * DYNAMIC ACCORD LIGHTING RIG (Step 7 — Automotive Studio Lighting)
 * ----------------------------------------------------------------------------
 * Transforms the vehicle from a static object into a physically believable
 * automotive scene photographed inside a dark automotive studio.
 *
 * Architecture:
 * 1. KEY LIGHT:
 *    Large soft directional light revealing hood, body panels, roof, shoulders.
 *    Smooth highlights, calibrated soft PCF directional shadow casting.
 * 2. RIM LIGHT:
 *    Cool titanium edge separator highlighting aerodynamic silhouette, roofline,
 *    and shoulder crease without neon exaggeration.
 * 3. FILL LIGHT:
 *    Low-angle warm bounce controlling shadow depth and subframe cavity visibility.
 * 4. AMBIENT BASELINE:
 *    Restrained slate tone for subtle overall radiance and balanced tone mapping.
 *
 * Responsiveness & Performance:
 * - Delta-time damped interpolation across the 5 canonical studio lighting states.
 * - Subtle pointer angle shift (±4°) without cursor chasing.
 * - Velocity-reactive highlight drift during rapid scrolling.
 * - Exploded view response: internal valvetrain surfaces reveal with boosted cavity illumination.
 * - Zero GC allocations inside useFrame.
 */

export function AccordLighting() {
  const keyLightRef = useRef<THREE.DirectionalLight>(null)
  const rimLightRef = useRef<THREE.DirectionalLight>(null)
  const fillLightRef = useRef<THREE.PointLight>(null)
  const ambientLightRef = useRef<THREE.AmbientLight>(null)

  // Step 10: Interior cabin lighting refs
  const cabinAmbientRef = useRef<THREE.PointLight>(null)
  const clusterBacklightRef = useRef<THREE.PointLight>(null)

  const quality = useMemo(() => getQualityConfig(), [])

  // Pre-allocated runtime lighting state target container (ZERO allocation in useFrame)
  const runtimeTarget = useMemo<RuntimeLightingValues>(() => createRuntimeLightingValues(), [])

  // Current smoothed vector & color values
  const currentKeyPos = useMemo(() => new THREE.Vector3(5.0, 5.5, 3.0), [])
  const currentRimPos = useMemo(() => new THREE.Vector3(-5.0, 4.0, -3.5), [])
  const currentFillPos = useMemo(() => new THREE.Vector3(0.0, -1.8, 2.5), [])
  const vRoadVehPos = useMemo(() => new THREE.Vector3(), [])

  const currentKeyColor = useMemo(() => new THREE.Color('#f5f6f8'), [])
  const currentRimColor = useMemo(() => new THREE.Color('#8ea0b5'), [])
  const currentFillColor = useMemo(() => new THREE.Color('#d6cfc7'), [])
  const currentAmbientColor = useMemo(() => new THREE.Color('#181b20'), [])

  // Step 12 Environment lighting color caches
  const cKeyEnv = useMemo(() => new THREE.Color(), [])
  const cAmbEnv = useMemo(() => new THREE.Color(), [])
  const cRimEnv = useMemo(() => new THREE.Color(), [])

  const smoothedKeyIntensity = useRef(0.75)
  const smoothedRimIntensity = useRef(1.25)
  const smoothedFillIntensity = useRef(0.32)
  const smoothedAmbientIntensity = useRef(0.45)

  // Step 10: Interior light intensity smoothing
  const smoothedCabinAmbient = useRef(0)
  const smoothedClusterGlow = useRef(0)

  useFrame((_, delta) => {
    const dt = Math.min(Math.max(delta, 0.001), 0.1)
    const isReduced = prefersReducedMotion()
    const motion = getUnifiedMotionState()
    const exploded = getExplodedState()

    // 1. Calculate live target lighting values for current scroll progress + pointer + velocity
    computeStudioLighting(
      motion.progress,
      motion.smoothedNX,
      motion.smoothedNY,
      motion.normalizedVelocity,
      runtimeTarget
    )

    // 2. Step 9 Exploded Engineering lighting response:
    // Subtly reveal internal valvetrain surfaces, cam journals, and carrier cavities
    const explodedBoost = exploded.progress * 0.35
    runtimeTarget.fillIntensity += explodedBoost
    runtimeTarget.rimIntensity += exploded.progress * 0.18

    // 2b. Step 13 Automotive Detail Studies lighting anticipation:
    // Focus key, rim, and fill lights dynamically on the macro component geometry
    const vehicleState = getVehicleState()
    if (vehicleState.activeDetailStudy && vehicleState.detailBlend > 0.001) {
      const studyMods = computeStudyLightingModifiers(
        vehicleState.activeDetailStudy,
        vehicleState.detailBlend,
        runtimeTarget.keyPos,
        runtimeTarget.rimPos,
        runtimeTarget.fillPos,
        runtimeTarget.keyPos,
        runtimeTarget.rimPos,
        runtimeTarget.fillPos
      )
      runtimeTarget.keyIntensity *= studyMods.keyIntensityMult
      runtimeTarget.rimIntensity *= studyMods.rimIntensityMult
      runtimeTarget.fillIntensity *= studyMods.fillIntensityMult
      if (studyMods.studyKeyColor) {
        runtimeTarget.keyColor.lerp(studyMods.studyKeyColor, vehicleState.detailBlend * 0.7)
      }
    }

    // 3. Damped automotive interpolation (60Hz / 120Hz invariant)
    const lambda = isReduced ? 28.0 : 8.0

    // Key Light Smoothing
    currentKeyPos.x = dampDt(currentKeyPos.x, runtimeTarget.keyPos.x, lambda, dt)
    currentKeyPos.y = dampDt(currentKeyPos.y, runtimeTarget.keyPos.y, lambda, dt)
    currentKeyPos.z = dampDt(currentKeyPos.z, runtimeTarget.keyPos.z, lambda, dt)
    currentKeyColor.lerp(runtimeTarget.keyColor, Math.min(lambda * dt, 1))
    smoothedKeyIntensity.current = dampDt(
      smoothedKeyIntensity.current,
      runtimeTarget.keyIntensity,
      lambda,
      dt
    )

    if (keyLightRef.current) {
      keyLightRef.current.position.copy(currentKeyPos)
      keyLightRef.current.color.copy(currentKeyColor)
      keyLightRef.current.intensity = smoothedKeyIntensity.current
    }

    // Rim Light Smoothing
    currentRimPos.x = dampDt(currentRimPos.x, runtimeTarget.rimPos.x, lambda, dt)
    currentRimPos.y = dampDt(currentRimPos.y, runtimeTarget.rimPos.y, lambda, dt)
    currentRimPos.z = dampDt(currentRimPos.z, runtimeTarget.rimPos.z, lambda, dt)
    currentRimColor.lerp(runtimeTarget.rimColor, Math.min(lambda * dt, 1))
    smoothedRimIntensity.current = dampDt(
      smoothedRimIntensity.current,
      runtimeTarget.rimIntensity,
      lambda,
      dt
    )

    if (rimLightRef.current) {
      rimLightRef.current.position.copy(currentRimPos)
      rimLightRef.current.color.copy(currentRimColor)
      rimLightRef.current.intensity = smoothedRimIntensity.current
    }

    // Fill Light Smoothing
    currentFillPos.x = dampDt(currentFillPos.x, runtimeTarget.fillPos.x, lambda, dt)
    currentFillPos.y = dampDt(currentFillPos.y, runtimeTarget.fillPos.y, lambda, dt)
    currentFillPos.z = dampDt(currentFillPos.z, runtimeTarget.fillPos.z, lambda, dt)
    currentFillColor.lerp(runtimeTarget.fillColor, Math.min(lambda * dt, 1))
    smoothedFillIntensity.current = dampDt(
      smoothedFillIntensity.current,
      runtimeTarget.fillIntensity,
      lambda,
      dt
    )

    if (fillLightRef.current) {
      fillLightRef.current.position.copy(currentFillPos)
      fillLightRef.current.color.copy(currentFillColor)
      fillLightRef.current.intensity = smoothedFillIntensity.current
    }

    // Ambient Baseline Smoothing
    currentAmbientColor.lerp(runtimeTarget.ambientColor, Math.min(lambda * dt, 1))
    smoothedAmbientIntensity.current = dampDt(
      smoothedAmbientIntensity.current,
      runtimeTarget.ambientIntensity,
      lambda,
      dt
    )

    if (ambientLightRef.current) {
      ambientLightRef.current.color.copy(currentAmbientColor)
      ambientLightRef.current.intensity = smoothedAmbientIntensity.current
    }

    // Step 10: Interior cabin lighting response
    const interiorProg = getMotionBridgeState().interiorProgress
    const isInCabin = interiorProg > 0.3

    // Target interior light intensities
    const cabinAmbientTarget = isInCabin ? Math.min((interiorProg - 0.3) / 0.25, 1.0) * 0.55 : 0
    const clusterGlowTarget = interiorProg > 0.45 ? Math.min((interiorProg - 0.45) / 0.15, 1.0) * 0.35 : 0

    smoothedCabinAmbient.current = dampDt(smoothedCabinAmbient.current, cabinAmbientTarget, lambda, dt)
    smoothedClusterGlow.current = dampDt(smoothedClusterGlow.current, clusterGlowTarget, lambda, dt)

    if (cabinAmbientRef.current) {
      cabinAmbientRef.current.intensity = smoothedCabinAmbient.current
    }
    if (clusterBacklightRef.current) {
      clusterBacklightRef.current.intensity = smoothedClusterGlow.current
    }

    // Dim exterior lighting when deeply inside cabin
    if (isInCabin && keyLightRef.current) {
      const dimFactor = 1.0 - interiorProg * 0.25
      keyLightRef.current.intensity *= dimFactor
    }

    // Step 11 & Step 12: Road driving dynamic lighting & Environmental time-of-day progression
    const roadProg = getMotionBridgeState().roadProgress
    const cameraMode = getMotionBridgeState().cameraMode
    if (roadProg > 0.001 || cameraMode === 'ROAD') {
      const env = getEnvironmentState()
      sampleRoadPoint(roadProg, vRoadVehPos)

      // Dynamic Sun Position based on elevation angle (Step 12 Requirements 5, 6, 7, 8)
      const elevationRad = Math.max(env.sunElevationDeg, -4) * (Math.PI / 180)
      const sunDist = 18.0
      const sunY = vRoadVehPos.y + Math.max(Math.sin(elevationRad) * sunDist, 2.0)
      const sunX = vRoadVehPos.x + Math.cos(elevationRad) * 11.0
      const sunZ = vRoadVehPos.z + 7.0

      if (keyLightRef.current) {
        keyLightRef.current.position.set(sunX, sunY, sunZ)
        keyLightRef.current.target.position.copy(vRoadVehPos)
        keyLightRef.current.target.updateMatrixWorld()

        cKeyEnv.set(env.keyColor)
        keyLightRef.current.color.lerp(cKeyEnv, Math.min(lambda * dt, 1))
        keyLightRef.current.intensity = env.keyIntensity
      }
      if (rimLightRef.current) {
        rimLightRef.current.position.set(vRoadVehPos.x - 7.0, vRoadVehPos.y + 8.0, vRoadVehPos.z - 6.0)
        cRimEnv.set(env.weatherState === 'BLUE_HOUR' ? '#6888b0' : '#8ea0b5')
        rimLightRef.current.color.lerp(cRimEnv, Math.min(lambda * dt, 1))
      }
      if (fillLightRef.current) {
        fillLightRef.current.position.set(vRoadVehPos.x, vRoadVehPos.y + 1.2, vRoadVehPos.z + 2.0)
      }
      if (ambientLightRef.current) {
        cAmbEnv.set(env.ambientColor)
        ambientLightRef.current.color.lerp(cAmbEnv, Math.min(lambda * dt, 1))
      }
    }
  })

  return (
    <group name="DYNAMIC_STUDIO_LIGHTING_RIG">
      {/* 1. Ambient Baseline Fill */}
      <ambientLight ref={ambientLightRef} color="#181b20" intensity={0.45} />

      {/* 2. Primary High-Angle Key Softbox */}
      <directionalLight
        ref={keyLightRef}
        position={[5.0, 5.5, 3.0]}
        intensity={0.75}
        color="#f5f6f8"
        castShadow={quality.enableDirectionalShadows}
        shadow-mapSize={[quality.shadowMapSize, quality.shadowMapSize]}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
        shadow-camera-left={-4.5}
        shadow-camera-right={4.5}
        shadow-camera-top={4.5}
        shadow-camera-bottom={-4.5}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />

      {/* 3. Cool Silhouette Rim Light */}
      <directionalLight
        ref={rimLightRef}
        position={[-5.0, 4.0, -3.5]}
        intensity={1.25}
        color="#8ea0b5"
      />

      {/* 4. Underside Warm Bounce Fill */}
      <pointLight
        ref={fillLightRef}
        position={[0.0, -1.8, 2.5]}
        intensity={0.32}
        distance={14}
        decay={1.6}
        color="#d6cfc7"
      />

      {/* Step 10: Interior Cabin Ambient Fill (from headliner bounce) */}
      <pointLight
        ref={cabinAmbientRef}
        position={[0.0, 5.0, 5.0]}
        intensity={0}
        distance={8}
        decay={1.8}
        color="#e8e2da"
      />

      {/* Step 10: Instrument Cluster Backlight (warm amber glow) */}
      <pointLight
        ref={clusterBacklightRef}
        position={[-0.12, 4.42, 5.75]}
        intensity={0}
        distance={3}
        decay={2.0}
        color="#2a6a4a"
      />
    </group>
  )
}
