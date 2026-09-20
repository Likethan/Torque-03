import { ContactShadows, AdaptiveDpr } from '@react-three/drei'
import { CameraRig } from './CameraRig'
import { AccordLighting } from './AccordLighting'
import { AccordModel } from './AccordModel'
import { CadInspectionSurface } from './webgl/CadInspectionSurface'
import { CinematicAtmosphere } from './atmosphere/CinematicAtmosphere'
import { InteriorCabin } from './interior/InteriorCabin'
import { InteriorAnnotations } from './interior/InteriorAnnotations'
import { RoadEnvironment } from './road/RoadEnvironment'
import { RoadVehicle } from './road/RoadVehicle'
import { CinematicRain } from './environment/CinematicRain'
import { DynamicEnvironmentFog } from './environment/DynamicEnvironmentFog'
import { VehicleDetailHotspots } from './vehicle/VehicleDetailHotspots'

export interface AccordSceneProps {
  interactive?: boolean
}

/**
 * ----------------------------------------------------------------------------
 * ACCORD SCENE ROOT (Step 12 — Environmental Interaction & Weather)
 * ----------------------------------------------------------------------------
 * Declarative 3D scene root composing:
 * - Exponential studio depth fog + Step 12 dynamic environmental fog
 * - Step 8 Cinematic WebGL Studio Atmosphere Scrim (GLSL optical backdrop)
 * - CAD Coordinate Datum Surface (Step 17 ShaderMaterial)
 * - CAD coordinate ground grid
 * - Composed CameraRig (PerspectiveCamera + scroll & pointer motion + interior blending)
 * - Studio lighting rig (Key, Ambient, Rim, Warm Fill + interior cabin lights + road dynamic sun)
 * - Drei ContactShadows for grounded mechanical presence
 * - Drei AdaptiveDpr for mobile and dynamic workload optimization
 * - AccordModel boundary wrapper (engineering assembly)
 * - InteriorCabin procedural cabin geometry (Step 10)
 * - InteriorAnnotations spatial 3D labels (Step 10)
 * - RoadEnvironment & Highway Ribbon (Step 11)
 * - Dynamic Moving Road Vehicle (Step 11)
 * - Step 12 Cinematic GPU-Instanced Rain & Road Mist
 */
export function AccordScene({ interactive = true }: AccordSceneProps) {
  return (
    <>
      {/* 1. Studio Depth Fog */}
      <fogExp2 attach="fog" args={['#0e1013', 0.04]} />

      {/* 1b. Step 12 Dynamic Environmental Fog Adapter */}
      <DynamicEnvironmentFog />

      {/* 2. Step 8 Cinematic WebGL Studio Atmosphere Scrim (GLSL) */}
      <CinematicAtmosphere />

      {/* 3. Step 17 Procedural CAD Datum Surface (GLSL ShaderMaterial) */}
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
        opacity={0.70}
        scale={10}
        blur={2.4}
        far={4}
        color="#040608"
      />

      {/* 5b. Directional Shadow Receiver Studio Floor Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.725, 0]} receiveShadow>
        <planeGeometry args={[32, 32]} />
        <shadowMaterial opacity={0.35} />
      </mesh>

      {/* 6. Drei Adaptive DPR (dynamically adjusts pixel ratio under mobile GPU pressure) */}
      <AdaptiveDpr pixelated={false} />

      {/* 7. Model-Ready Component Boundary */}
      <AccordModel />

      {/* 8. Step 10: Interior Cabin Procedural Geometry */}
      <InteriorCabin />

      {/* 9. Step 10: Interior Spatial Annotations */}
      <InteriorAnnotations />

      {/* 10. Step 11: Road Environment & Highway Ribbon */}
      <RoadEnvironment />

      {/* 11. Step 11: Dynamic Moving Road Vehicle */}
      <RoadVehicle />

      {/* 11b. Step 13: 3D Automotive Detail Hotspots */}
      <VehicleDetailHotspots />

      {/* 12. Step 12: Cinematic GPU-Instanced Rain Streaks & Tire Mist */}
      <CinematicRain />
    </>
  )
}

