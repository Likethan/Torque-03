import { ContactShadows, AdaptiveDpr } from '@react-three/drei'
import { CameraRig } from './CameraRig'
import { AccordLighting } from './AccordLighting'
import { AccordModel } from './AccordModel'
import { CadInspectionSurface } from './webgl/CadInspectionSurface'

export interface AccordSceneProps {
  interactive?: boolean
}

/**
 * ----------------------------------------------------------------------------
 * ACCORD SCENE ROOT (Step 14 — React Three Fiber + Drei)
 * ----------------------------------------------------------------------------
 * Declarative 3D scene root composing:
 * - Exponential studio depth fog
 * - CAD Coordinate Datum Surface (Step 17 ShaderMaterial)
 * - CAD coordinate ground grid
 * - Composed CameraRig (PerspectiveCamera + scroll & pointer motion)
 * - Studio lighting rig (Key, Ambient, Rim, Warm Fill)
 * - Drei ContactShadows for grounded mechanical presence
 * - Drei AdaptiveDpr for mobile and dynamic workload optimization
 * - AccordModel boundary wrapper
 */
export function AccordScene({ interactive = true }: AccordSceneProps) {
  return (
    <>
      {/* 1. Studio Depth Fog */}
      <fogExp2 attach="fog" args={['#0e1013', 0.04]} />

      {/* 2. Step 17 Procedural CAD Datum Surface (GLSL ShaderMaterial) */}
      <CadInspectionSurface />

      {/* 3. CAD Coordinate Ground Grid */}
      <gridHelper args={[16, 32, 0x2a313a, 0x161a20]} position={[0, -1.2, 0]} />

      {/* 3. Composed Camera Rig */}
      <CameraRig interactive={interactive} initialFov={38} />

      {/* 4. Automotive Studio Lighting */}
      <AccordLighting />

      {/* 5. Drei Ground Contact Shadows */}
      <ContactShadows
        position={[0, -0.72, 0]}
        opacity={0.65}
        scale={10}
        blur={2.2}
        far={4}
        color="#05070a"
      />

      {/* 6. Drei Adaptive DPR (dynamically adjusts pixel ratio under mobile GPU pressure) */}
      <AdaptiveDpr pixelated={false} />

      {/* 7. Model-Ready Component Boundary */}
      <AccordModel />
    </>
  )
}
