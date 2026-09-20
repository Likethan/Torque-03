import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { sampleChoreography } from './camera/cameraChoreography'
import { sampleInteriorChoreography } from './camera/cameraChoreography'
import { sampleRoadChoreography } from './road/roadCameraChoreography'
import type { CameraStateId } from './camera/cameraTypes'
import { getVehicleState, setDetailBlendRuntime, sampleDetailChoreography } from './vehicle'
import { getInteractionState } from '../interaction/interactionStore'
import { getMotionBridgeState, updateChoreographyRuntime } from './motionBridge'
import { updateChoreographyTelemetry, updateGpuTelemetry } from './telemetry'
import { getWebGLCapabilities } from './webgl/webglCapabilities'
import { prefersReducedMotion } from '../animation/gsapConfig'
import { updateSharedTime, getUnifiedMotionState } from '../motion/unifiedMotion'
import { dampDt } from '../motion/lerp'
import { MOTION_TOKENS } from '../motion/motionTokens'

export interface CameraRigProps {
  interactive?: boolean
  initialFov?: number
}

/**
 * ----------------------------------------------------------------------------
 * CAMERA RIG CONTROLLER (Step 15 + Step 10 Interior + Step 13 Detail)
 * ----------------------------------------------------------------------------
 * Target-based camera choreography controller implementing:
 *
 * 1. Global Progress -> Waypoint Interpolation (exterior engineering)
 * 2. Interior Progress -> Interior Waypoint Interpolation (cabin journey)
 * 3. Road Progress -> Road Waypoint Interpolation (dynamic driving)
 * 4. Step 13 Detail Study Blending -> Macro close-up automotive studies
 * 5. Smooth blending between all camera domains with reversible transitions
 * 6. Dynamic FOV animation across all modes
 * 7. Composed Priority Pipeline:
 *    finalCameraPosition = blendedPosition + pointerOffset + velocityInertia
 * 8. Responsive scaling for mobile viewports
 * 9. Damped automotive interpolation (60Hz/120Hz invariant)
 */
export function CameraRig({ interactive = true, initialFov = 38 }: CameraRigProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const { gl, size } = useThree()

  // Pre-allocated static vectors (ZERO garbage collection in useFrame)
  const choreographedPos = useMemo(() => new THREE.Vector3(5.2, 3.2, 6.4), [])
  const choreographedTarget = useMemo(() => new THREE.Vector3(0, 0, 0), [])
  const currentCameraPos = useMemo(() => new THREE.Vector3(5.2, 3.2, 6.4), [])
  const currentCameraTarget = useMemo(() => new THREE.Vector3(0, 0, 0), [])
  const pointerOffset = useMemo(() => new THREE.Vector3(0, 0, 0), [])
  const finalPos = useMemo(() => new THREE.Vector3(5.2, 3.2, 6.4), [])

  // Step 10: Interior camera vectors (pre-allocated)
  const interiorPos = useMemo(() => new THREE.Vector3(0, 0, 0), [])
  const interiorTarget = useMemo(() => new THREE.Vector3(0, 0, 0), [])
  const blendedPos = useMemo(() => new THREE.Vector3(0, 0, 0), [])
  const blendedTarget = useMemo(() => new THREE.Vector3(0, 0, 0), [])

  // Step 10: Smoothed FOV and interior blend factor
  const smoothedFov = useRef(initialFov)
  const smoothedInteriorBlend = useRef(0)

  // Step 11: Road camera vectors & blend factor (pre-allocated)
  const roadPos = useMemo(() => new THREE.Vector3(0, 0, 0), [])
  const roadTarget = useMemo(() => new THREE.Vector3(0, 0, 0), [])
  const smoothedRoadBlend = useRef(0)

  // Step 13: Detail study camera vectors & blend factor (pre-allocated)
  const detailPos = useMemo(() => new THREE.Vector3(0, 0, 0), [])
  const detailTarget = useMemo(() => new THREE.Vector3(0, 0, 0), [])
  const smoothedDetailBlend = useRef(0)

  // Step 10: Accumulated time for idle breathing
  const idleTimeAccum = useRef(0)

  useFrame((_, delta) => {
    updateSharedTime(delta)
    const cam = cameraRef.current
    if (!cam) return

    const dt = Math.min(Math.max(delta, 0.001), 0.1)
    const isReduced = prefersReducedMotion()
    const motion = getMotionBridgeState()
    const sharedMotion = getUnifiedMotionState()
    const pointer = getInteractionState()

    // 1. Responsive scale factor (Desktop: 1.0, Mobile: 1.25 to widen framing)
    const isMobile = size.width < 768
    const responsiveScale = isMobile ? 1.25 : size.width < 1024 ? 1.12 : 1.0

    // 2. Sample exterior choreographed camera waypoint state
    const { activeWaypoint, localProgress, componentElevation, assemblyAzimuth } =
      sampleChoreography(motion.globalProgress, choreographedPos, choreographedTarget, responsiveScale)

    // 3. Step 10: Sample interior choreography if interiorProgress > 0
    const interiorProg = motion.interiorProgress
    let targetFov = initialFov
    let targetPointerScale = 1.0

    if (interiorProg > 0.001) {
      const interiorResult = sampleInteriorChoreography(
        interiorProg,
        interiorPos,
        interiorTarget,
        responsiveScale
      )
      targetFov = interiorResult.fov
      targetPointerScale = interiorResult.pointerScale
    }

    // 4. Step 10: Calculate interior blend factor (smooth transition)
    const targetBlend = interiorProg > 0.001 ? Math.min(interiorProg / 0.08, 1.0) : 0.0
    const blendLambda = isReduced ? 24.0 : 6.0
    smoothedInteriorBlend.current = dampDt(smoothedInteriorBlend.current, targetBlend, blendLambda, dt)
    const blend = smoothedInteriorBlend.current

    // 5. Blend exterior and interior camera positions
    if (blend > 0.001) {
      blendedPos.lerpVectors(choreographedPos, interiorPos, blend)
      blendedTarget.lerpVectors(choreographedTarget, interiorTarget, blend)
    } else {
      blendedPos.copy(choreographedPos)
      blendedTarget.copy(choreographedTarget)
    }

    // 6. Step 10: Subtle idle breathing when deeply inside cabin
    if (!isReduced && blend > 0.8 && interiorProg > 0.5 && interiorProg < 0.85) {
      idleTimeAccum.current += dt
      const breathX = Math.sin(idleTimeAccum.current * 0.35) * 0.008
      const breathY = Math.cos(idleTimeAccum.current * 0.22) * 0.005
      blendedPos.x += breathX
      blendedPos.y += breathY
    }

    // 6b. Step 11: Sample road choreography when roadProgress > 0 or cameraMode is ROAD
    const roadProg = motion.roadProgress
    if (roadProg > 0.0001 || motion.cameraMode === 'ROAD') {
      const roadResult = sampleRoadChoreography(
        roadProg,
        roadPos,
        roadTarget,
        responsiveScale
      )
      const targetRoadBlend = Math.min(roadProg / 0.06, 1.0)
      smoothedRoadBlend.current = dampDt(smoothedRoadBlend.current, targetRoadBlend, blendLambda, dt)
      const rBlend = smoothedRoadBlend.current

      if (rBlend > 0.001) {
        blendedPos.lerpVectors(blendedPos, roadPos, rBlend)
        blendedTarget.lerpVectors(blendedTarget, roadTarget, rBlend)
        targetFov = THREE.MathUtils.lerp(targetFov, roadResult.fov, rBlend)
        targetPointerScale = THREE.MathUtils.lerp(targetPointerScale, roadResult.pointerScale, rBlend)
      }
    }

    // 6c. Step 13: Sample automotive detail study choreography
    const vehicleState = getVehicleState()
    const isDetailActive = vehicleState.activeDetailStudy !== null
    if (isDetailActive && vehicleState.activeDetailStudy) {
      const detailResult = sampleDetailChoreography(
        vehicleState.activeDetailStudy,
        detailPos,
        detailTarget,
        responsiveScale
      )
      targetFov = detailResult.fov
      targetPointerScale = detailResult.pointerScale
    }

    const targetDetailBlend = isDetailActive ? 1.0 : 0.0
    const detailBlendLambda = isReduced ? 24.0 : 6.0
    smoothedDetailBlend.current = dampDt(smoothedDetailBlend.current, targetDetailBlend, detailBlendLambda, dt)
    const dBlend = smoothedDetailBlend.current

    // Feed smoothed blend back to vehicle store for lighting anticipation and shader reaction
    setDetailBlendRuntime(dBlend)

    if (dBlend > 0.001) {
      blendedPos.lerpVectors(blendedPos, detailPos, dBlend)
      blendedTarget.lerpVectors(blendedTarget, detailTarget, dBlend)
    }

    // 7. Compute pointer parallax offset (scaled by interior & detail pointerScale)
    if (interactive && !isReduced && !pointer.touchMode) {
      const baseScale = isMobile ? 0.25 : 1.0
      const scale = baseScale * (dBlend > 0.01 || blend > 0.01 ? targetPointerScale : 1.0)
      const velLead = (sharedMotion.normalizedVelocity * 0.12) * scale
      pointerOffset.set(
        sharedMotion.smoothedNX * 0.32 * scale + velLead,
        -sharedMotion.smoothedNY * 0.2 * scale,
        0
      )
    } else {
      pointerOffset.set(0, 0, 0)
    }

    // 8. Compose final position: blendedChoreography + pointerOffset
    finalPos.copy(blendedPos).add(pointerOffset)

    // 9. Delta-time aware damped interpolation for physical automotive mass
    const lambda = isReduced ? MOTION_TOKENS.damping.reducedMotion : MOTION_TOKENS.damping.camera
    currentCameraPos.x = dampDt(currentCameraPos.x, finalPos.x, lambda, dt)
    currentCameraPos.y = dampDt(currentCameraPos.y, finalPos.y, lambda, dt)
    currentCameraPos.z = dampDt(currentCameraPos.z, finalPos.z, lambda, dt)

    currentCameraTarget.x = dampDt(currentCameraTarget.x, blendedTarget.x, lambda, dt)
    currentCameraTarget.y = dampDt(currentCameraTarget.y, blendedTarget.y, lambda, dt)
    currentCameraTarget.z = dampDt(currentCameraTarget.z, blendedTarget.z, lambda, dt)

    // 10. Update Three.js camera transforms
    cam.position.copy(currentCameraPos)
    cam.lookAt(currentCameraTarget)

    // 11. Step 10 & 13: Smooth FOV transition
    const hasCustomCam = dBlend > 0.01 || blend > 0.01 || smoothedRoadBlend.current > 0.01
    const fovTarget = hasCustomCam ? targetFov : initialFov
    smoothedFov.current = dampDt(smoothedFov.current, fovTarget, isReduced ? 20.0 : 5.0, dt)
    if (Math.abs(cam.fov - smoothedFov.current) > 0.01) {
      cam.fov = smoothedFov.current
      cam.updateProjectionMatrix()
    }

    // 12. Synchronize shared motion state
    const currentModeId =
      dBlend > 0.5
        ? (vehicleState.activeDetailStudy ?? 'DETAIL')
        : blend > 0.5
        ? (interiorProg > 0.001 ? 'INTERIOR_CABIN' : activeWaypoint.id)
        : activeWaypoint.id

    updateChoreographyRuntime(
      currentModeId as CameraStateId,
      localProgress,
      componentElevation,
      assemblyAzimuth,
      currentCameraPos.x,
      currentCameraPos.y,
      currentCameraPos.z,
      currentCameraTarget.x,
      currentCameraTarget.y,
      currentCameraTarget.z,
      pointerOffset.x,
      pointerOffset.y
    )

    // 13. Update high-frequency telemetry
    updateChoreographyTelemetry(
      currentModeId,
      motion.globalProgress,
      localProgress,
      cam.position.x,
      cam.position.y,
      cam.position.z,
      currentCameraTarget.x,
      currentCameraTarget.y,
      currentCameraTarget.z,
      cam.rotation.x,
      cam.rotation.y,
      cam.rotation.z,
      0,
      assemblyAzimuth,
      0,
      componentElevation,
      pointerOffset.x,
      pointerOffset.y,
      7,
      gl.getPixelRatio(),
      Math.round(size.width),
      Math.round(size.height)
    )

    // 14. Update GPU telemetry
    const caps = getWebGLCapabilities(gl.getContext())
    updateGpuTelemetry(gl, caps.version, caps.unmaskedRenderer)
  })

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={initialFov}
      near={0.1}
      far={100}
      position={[5.2, 3.2, 6.4]}
    />
  )
}

