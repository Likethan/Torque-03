import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { sampleChoreography } from './camera/cameraChoreography'
import { getInteractionState } from '../interaction/interactionStore'
import { getMotionBridgeState, updateChoreographyRuntime } from './motionBridge'
import { updateChoreographyTelemetry, updateGpuTelemetry } from './telemetry'
import { getWebGLCapabilities } from './webgl/webglCapabilities'
import { prefersReducedMotion } from '../animation/gsapConfig'
import { updateSharedTime } from '../motion/unifiedMotion'

export interface CameraRigProps {
  interactive?: boolean
  initialFov?: number
}

/**
 * ----------------------------------------------------------------------------
 * CAMERA RIG CONTROLLER (Step 15 — 3D Choreography)
 * ----------------------------------------------------------------------------
 * Target-based camera choreography controller implementing:
 *
 * 1. Global Progress -> Waypoint Interpolation:
 *    Computes exact choreographed camera position and lookAt target without
 *    instantiating new vectors per frame.
 * 2. Composed Priority Pipeline (Requirement 12 & 33):
 *    finalCameraPosition = scrollCameraPosition + pointerOffset
 * 3. Responsive Scaling (Requirement 18):
 *    Adapts camera distance scale factor for mobile viewports.
 * 4. Damped Automotive Interpolation (Requirement 6):
 *    Smooth lerp eliminating jitter during rapid scroll velocity changes.
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

  useFrame((_, delta) => {
    updateSharedTime(delta)
    const cam = cameraRef.current
    if (!cam) return

    const isReduced = prefersReducedMotion()
    const motion = getMotionBridgeState()
    const pointer = getInteractionState()

    // 1. Responsive scale factor (Desktop: 1.0, Mobile: 1.25 to widen framing)
    const isMobile = size.width < 768
    const responsiveScale = isMobile ? 1.25 : size.width < 1024 ? 1.12 : 1.0

    // 2. Sample choreographed camera waypoint state
    const { activeWaypoint, localProgress, componentElevation, assemblyAzimuth } =
      sampleChoreography(motion.globalProgress, choreographedPos, choreographedTarget, responsiveScale)

    // 3. Compute subtle pointer parallax offset (Requirement 11)
    if (interactive && !isReduced && !pointer.touchMode) {
      // Muted parallax (max ±0.32m horizontal, ±0.20m vertical)
      const scale = isMobile ? 0.25 : 1.0
      pointerOffset.set(
        pointer.smoothedNX * 0.32 * scale,
        -pointer.smoothedNY * 0.2 * scale,
        0
      )
    } else {
      pointerOffset.set(0, 0, 0)
    }

    // 4. Compose final position: scrollChoreography + pointerOffset (Requirement 12)
    finalPos.copy(choreographedPos).add(pointerOffset)

    // 5. Damped interpolation for cinematic weight (Requirement 6)
    // Lerp factor 0.1 gives physical mass and eliminates discrete scroll notches
    currentCameraPos.lerp(finalPos, 0.1)
    currentCameraTarget.lerp(choreographedTarget, 0.1)

    // 6. Update Three.js camera transforms
    cam.position.copy(currentCameraPos)
    cam.lookAt(currentCameraTarget)

    // 7. Synchronize shared motion state
    updateChoreographyRuntime(
      activeWaypoint.id,
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

    // 8. Update high-frequency telemetry for development debug overlay
    updateChoreographyTelemetry(
      activeWaypoint.id,
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
      7, // Tracked mesh count in engineering assembly
      gl.getPixelRatio(),
      Math.round(size.width),
      Math.round(size.height)
    )

    // 9. Update low-level WebGL and GPU telemetry (Step 17)
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
