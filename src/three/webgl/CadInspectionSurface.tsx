import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { createCadInspectionMaterial } from './cadInspectionShader'
import { getMotionBridgeState } from '../motionBridge'
import { getInteractionState } from '../../interaction/interactionStore'
import { prefersReducedMotion } from '../../animation/gsapConfig'

/**
 * ----------------------------------------------------------------------------
 * CAD INSPECTION DATUM SURFACE (Step 17 — WebGL Fundamentals)
 * ----------------------------------------------------------------------------
 * A procedural GLSL ShaderMaterial datum plane grounded beneath the Accord
 * engineering assembly.
 *
 * Demonstrates WebGL low-level rendering concepts:
 * - Direct GPU uniform passing (uTime, uProgress, uPointer, uResolution)
 * - Anti-aliased fwidth() screen-space derivative procedural grid
 * - Dynamic optical inspection sweep synchronized with ScrollTrigger
 * - Direct zero-allocation update loop in useFrame
 */
export function CadInspectionSurface() {
  const meshRef = useRef<THREE.Mesh>(null)

  // Initialize shader material and uniform reference container
  const { material, uniforms } = useMemo(() => createCadInspectionMaterial(), [])
  const size = useThree((state) => state.size)

  useFrame((_, delta) => {
    const isReduced = prefersReducedMotion()
    const motion = getMotionBridgeState()
    const interaction = getInteractionState()

    // 1. Update Time uniform (elapsed delta)
    if (!isReduced) {
      uniforms.uTime.value += delta
    }

    // 2. Update Scroll Progress uniform [0.0, 1.0]
    uniforms.uProgress.value = motion.globalProgress

    // 3. Update Normalized Pointer uniform [-1.0, 1.0]
    if (!isReduced) {
      uniforms.uPointer.value.set(interaction.normalizedX, interaction.normalizedY)
    } else {
      uniforms.uPointer.value.set(0, 0)
    }

    // 4. Update Viewport Resolution
    uniforms.uResolution.value.set(size.width, size.height)

    // 5. Context-aware inspection highlight: intensify scanning beam during disassembly
    if (motion.explodedProgress > 0.05) {
      uniforms.uScanIntensity.value = 1.25
      uniforms.uGridColor.value.set('#00d4ff') // Technical cyan highlight
    } else {
      uniforms.uScanIntensity.value = 0.55
      uniforms.uGridColor.value.set('#38424d') // Neutral satin steel
    }
  })

  return (
    <mesh
      ref={meshRef}
      name="CAD_INSPECTION_DATUM_SURFACE"
      position={[0, -1.18, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      material={material}
    >
      {/* 18m x 18m precision engineering datum plane */}
      <planeGeometry args={[18, 18, 1, 1]} />
    </mesh>
  )
}
