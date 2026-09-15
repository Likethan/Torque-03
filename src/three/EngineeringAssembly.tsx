import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { createAccordMaterials } from './AccordMaterials'
import { getMotionBridgeState, updateMechanicalRuntime, updateShaderRuntime } from './motionBridge'
import { updateMechanicalTelemetry, updateAccordShaderTelemetry } from './telemetry'
import { prefersReducedMotion } from '../animation/gsapConfig'
import { createAccordInspectionMaterial } from './shaders/accord'
import { getShaderMotionInput } from '../motion/unifiedMotion'
import {
  calculateValvetrainKinematics,
  GEAR_RATIO,
  computeCamLift,
  computeRockerAngle,
  computeValveTravel,
  VelocityTracker,
} from './physics'

/**
 * ----------------------------------------------------------------------------
 * ENGINEERING ASSEMBLY COMPONENT (Step 16 — Mechanical Physics)
 * ----------------------------------------------------------------------------
 * Procedural mechanical physics valvetrain assembly:
 * - Counter-rotating Gear A (sprocket) and Gear B (secondary gear, ratio -2.0)
 * - Eccentric Camshaft lobes driving harmonic lift
 * - Rocker Arms pivoting around dedicated rocker shaft hinge axes
 * - Linear spring-loaded Valve Stems reciprocating vertically
 * - Controlled exploded-view inspection disassembly along deliberate physical axes
 * - Seamless reconstruction back into nominal factory tolerances on upward scroll
 * - Direct zero-allocation telemetry updates to high-frequency HUD outside React state
 */
export function EngineeringAssembly() {
  const assemblyRef = useRef<THREE.Group>(null)
  const shaftRef = useRef<THREE.Group>(null)
  const drivenGearRef = useRef<THREE.Group>(null)
  const rocker1PivotRef = useRef<THREE.Group>(null)
  const rocker2PivotRef = useRef<THREE.Group>(null)
  const valve1Ref = useRef<THREE.Group>(null)
  const valve2Ref = useRef<THREE.Group>(null)
  const valveCoverRef = useRef<THREE.Group>(null)
  const bearingCapsRef = useRef<THREE.Group>(null)
  const valveBankRef = useRef<THREE.Group>(null)

  // Reusable PBR material tokens
  const materials = useMemo(() => createAccordMaterials(), [])

  // Step 18 Accord Custom GLSL Inspection Material
  const inspectionMaterialInstance = useMemo(
    () =>
      createAccordInspectionMaterial({
        baseColor: '#20242a',
        edgeColor: '#9ba4b0',
        accentRed: '#c8102e',
      }),
    []
  )

  // Velocity tracker for scroll/mechanical impulse
  const velocityTracker = useMemo(() => new VelocityTracker(), [])

  // Accumulator for continuous camshaft rotation
  const camAngleAccumulator = useRef(0)

  // Nominal component coordinates
  const NOMINAL_COVER_Y = 0.88
  const NOMINAL_CAPS_Y = 0.38
  const NOMINAL_VALVE_Y = 0.42

  // Unified R3F frame loop executing procedural mechanical physics
  useFrame((_, delta) => {
    const isReduced = prefersReducedMotion()
    const motion = getMotionBridgeState()

    // 1. Calculate mechanical velocity from scroll progress
    const scrollVelocity = velocityTracker.update(motion.globalProgress, delta)

    // 2. Primary camshaft angular accumulation
    // In idle operation: ~1.45 rad/s baseline.
    // Augmented slightly by scroll velocity impulse (Requirement 18).
    if (!isReduced) {
      const scrollImpulse = Math.abs(scrollVelocity) * 2.2
      camAngleAccumulator.current += delta * (1.45 + scrollImpulse)
    }

    // 3. Procedural Valvetrain Kinematics Calculation (Zero-allocation)
    const kinematics = calculateValvetrainKinematics(
      camAngleAccumulator.current,
      motion.globalProgress,
      scrollVelocity
    )

    // Secondary cylinder 2 cam lift & rocker calculation (180 deg out of phase)
    const camLift2 = computeCamLift(camAngleAccumulator.current, undefined, Math.PI)
    const rocker2 = computeRockerAngle(camLift2)
    const valve2 = computeValveTravel(camLift2)

    // 4. Apply Primary Camshaft rotation
    if (shaftRef.current) {
      shaftRef.current.rotation.x = kinematics.camAngleRad
    }

    // 5. Apply Secondary Driven Gear rotation and exploded clearance (Requirement 7 & 16)
    // Relationship: driven gear counter-rotates with ratio -2.0
    if (drivenGearRef.current) {
      drivenGearRef.current.rotation.x = kinematics.drivenGearAngleRad
      // Exploded-view axial clearance along -X
      drivenGearRef.current.position.x = -1.25 + kinematics.gearSeparationMeters
    }

    // 6. Apply Hinged Rocker Arm angular deflection (Requirement 11: Hinge System)
    // Rocker arms pivot around the rocker shaft center axis
    if (rocker1PivotRef.current) {
      rocker1PivotRef.current.rotation.x = kinematics.rockerAngleRad
    }
    if (rocker2PivotRef.current) {
      rocker2PivotRef.current.rotation.x = rocker2.angle
    }

    // 7. Apply Linear Valve Stem reciprocating travel (Requirement 9)
    // Pushrod / valve stem descends linearly as cam lift rises
    if (valve1Ref.current) {
      valve1Ref.current.position.y = NOMINAL_VALVE_Y - kinematics.valveTravelMeters
    }
    if (valve2Ref.current) {
      valve2Ref.current.position.y = NOMINAL_VALVE_Y - valve2.travel
    }

    // 8. Apply Exploded-View Disassembly & Reconstruction Transforms (Requirements 15, 16, 17)
    // Upper valve cover lifts along +Y to reveal internal valvetrain
    if (valveCoverRef.current) {
      valveCoverRef.current.position.y = NOMINAL_COVER_Y + kinematics.coverElevationMeters
    }

    // Cam journal bearing caps elevate along +Y
    if (bearingCapsRef.current) {
      bearingCapsRef.current.position.y = NOMINAL_CAPS_Y + kinematics.capsElevationMeters
    }

    // Secondary valve guide bank elevates along +Y
    if (valveBankRef.current) {
      valveBankRef.current.position.y = motion.componentElevation
    }

    // 9. Apply Choreographed Assembly Azimuth (from Step 15)
    if (assemblyRef.current) {
      assemblyRef.current.rotation.y = motion.assemblyAzimuth
    }

    // 10. Direct Telemetry Updates (zero React state re-renders)
    updateMechanicalRuntime(
      kinematics.explodedProgress,
      kinematics.camAngleDeg,
      kinematics.drivenGearAngleDeg,
      kinematics.valveTravelMm,
      kinematics.rockerAngleDeg,
      scrollVelocity,
      kinematics.constraintStatus
    )

    updateMechanicalTelemetry(
      motion.globalProgress,
      scrollVelocity,
      kinematics.explodedProgress,
      kinematics.camAngleDeg,
      kinematics.drivenGearAngleDeg,
      GEAR_RATIO,
      kinematics.valveTravelMm,
      kinematics.rockerAngleDeg,
      kinematics.constraintStatus
    )

    // 11. Step 18 & 19: Accord GLSL Shader Uniform Updates via Unified Motion Adapter
    const shaderInput = getShaderMotionInput()
    const shaderUniforms = inspectionMaterialInstance.uniforms
    if (!shaderInput.isReduced) {
      shaderUniforms.uTime.value += delta
      shaderUniforms.uPointer.value.set(shaderInput.pointerX, shaderInput.pointerY)
    } else {
      shaderUniforms.uPointer.value.set(0, 0)
    }
    shaderUniforms.uProgress.value = shaderInput.progress
    shaderUniforms.uInspection.value = shaderInput.inspection
    shaderUniforms.uReveal.value = shaderInput.reveal
    shaderUniforms.uIntensity.value = shaderInput.intensity

    updateShaderRuntime(shaderInput.inspection, shaderInput.reveal, shaderInput.intensity)
    updateAccordShaderTelemetry(
      shaderInput.inspection,
      shaderInput.reveal,
      shaderInput.intensity,
      inspectionMaterialInstance.isCustomShader
    )
  })

  return (
    <group ref={assemblyRef} name="ENGINEERING_ASSEMBLY" position={[0, 0, 0]}>
      {/* 1. Main Cylinder Head Base Carrier Block (Stationary parent casting with GLSL edge contouring) */}
      <mesh name="BASE_CARRIER_BLOCK" position={[0, -0.4, 0]}>
        <boxGeometry args={[2.4, 0.65, 1.3]} />
        <primitive object={inspectionMaterialInstance.material} attach="material" />
      </mesh>

      {/* Subframe mounting flanges */}
      <mesh name="LEFT_LUG" position={[-1.05, -0.2, 0.75]}>
        <cylinderGeometry args={[0.24, 0.24, 0.45, 24]} />
        <primitive object={materials.castMetal} attach="material" />
      </mesh>
      <mesh name="RIGHT_LUG" position={[1.05, -0.2, 0.75]}>
        <cylinderGeometry args={[0.24, 0.24, 0.45, 24]} />
        <primitive object={materials.castMetal} attach="material" />
      </mesh>

      {/* Stationary Rocker Shaft (Hinge Pivot Axis, Z = +0.32) */}
      <mesh name="ROCKER_PIVOT_SHAFT" position={[0, 0.52, 0.32]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 2.1, 24]} />
        <primitive object={materials.polishedChrome} attach="material" />
      </mesh>

      {/* 2. Primary Camshaft Group (Driven via shaftRef) */}
      <group ref={shaftRef} name="ROTATING_CAMSHAFT_GROUP" position={[0, 0.28, 0]}>
        {/* Central Camshaft */}
        <mesh name="CENTRAL_SHAFT" rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.14, 0.14, 2.7, 32]} />
          <primitive object={materials.satinSteel} attach="material" />
        </mesh>

        {/* Primary Timing Sprocket / Gear A (Radius 0.58m) */}
        <mesh name="PRIMARY_DRIVE_SPROCKET" position={[-1.25, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.58, 0.58, 0.18, 36]} />
          <primitive object={materials.anodizedDark} attach="material" />
        </mesh>

        {/* Sprocket Rim Ring */}
        <mesh name="SPROCKET_RIM_RING" position={[-1.25, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.52, 0.04, 16, 36]} />
          <primitive object={materials.satinSteel} attach="material" />
        </mesh>

        {/* Eccentric VTEC Cam Lobe 1 (Offset +Y, Phase 0) */}
        <mesh name="CAM_LOBE_CYL_1" position={[-0.35, 0.09, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.24, 0.24, 0.22, 24]} />
          <primitive object={materials.polishedChrome} attach="material" />
        </mesh>

        {/* Eccentric VTEC Cam Lobe 2 (Offset -Y, Phase Pi) */}
        <mesh name="CAM_LOBE_CYL_2" position={[0.35, -0.09, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.24, 0.24, 0.22, 24]} />
          <primitive object={materials.polishedChrome} attach="material" />
        </mesh>

        {/* Precision Technical Index Collar (Championship Red Accent) */}
        <mesh name="TECHNICAL_INDEX_COLLAR" position={[0.85, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.22, 0.035, 16, 32]} />
          <primitive object={materials.championshipRed} attach="material" />
        </mesh>
      </group>

      {/* 3. Secondary Driven Gear Group (Gear B, Ratio -2.0, Counter-Rotating) */}
      <group ref={drivenGearRef} name="DRIVEN_SECONDARY_GEAR_GROUP" position={[-1.25, 0.82, 0]}>
        {/* Driven Gear Wheel (Radius 0.29m, meshes with 0.58m primary) */}
        <mesh name="DRIVEN_GEAR_WHEEL" rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.29, 0.29, 0.16, 32]} />
          <primitive object={materials.satinSteel} attach="material" />
        </mesh>
        {/* Driven Gear Shaft Stub */}
        <mesh name="DRIVEN_GEAR_STUB" rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, 0.38, 20]} />
          <primitive object={materials.anodizedDark} attach="material" />
        </mesh>
        {/* Alignment Index Marker */}
        <mesh position={[0, 0.21, 0.09]}>
          <boxGeometry args={[0.04, 0.08, 0.03]} />
          <primitive object={materials.championshipRed} attach="material" />
        </mesh>
      </group>

      {/* 4. Hinged Rocker Arm 1 (Pivot Group at Rocker Shaft Axis [X=-0.35, Y=0.52, Z=0.32]) */}
      <group ref={rocker1PivotRef} name="ROCKER_1_HINGE_GROUP" position={[-0.35, 0.52, 0.32]}>
        {/* Rocker Arm Collar (encircles rocker shaft) */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 0.18, 20]} />
          <primitive object={materials.satinSteel} attach="material" />
        </mesh>
        {/* Cam Roller Follower Finger (extends toward camshaft: -Z, -Y) */}
        <mesh position={[0, -0.12, -0.16]} rotation={[0.45, 0, 0]}>
          <boxGeometry args={[0.12, 0.08, 0.24]} />
          <primitive object={materials.polishedChrome} attach="material" />
        </mesh>
        {/* Valve Actuator Tip (extends toward valve stem: +Z, -Y) */}
        <mesh position={[0, -0.06, 0.18]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[0.10, 0.07, 0.22]} />
          <primitive object={materials.polishedChrome} attach="material" />
        </mesh>
      </group>

      {/* 5. Hinged Rocker Arm 2 (Pivot Group at Rocker Shaft Axis [X=+0.35, Y=0.52, Z=0.32]) */}
      <group ref={rocker2PivotRef} name="ROCKER_2_HINGE_GROUP" position={[0.35, 0.52, 0.32]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 0.18, 20]} />
          <primitive object={materials.satinSteel} attach="material" />
        </mesh>
        <mesh position={[0, -0.12, -0.16]} rotation={[0.45, 0, 0]}>
          <boxGeometry args={[0.12, 0.08, 0.24]} />
          <primitive object={materials.polishedChrome} attach="material" />
        </mesh>
        <mesh position={[0, -0.06, 0.18]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[0.10, 0.07, 0.22]} />
          <primitive object={materials.polishedChrome} attach="material" />
        </mesh>
      </group>

      {/* 6. Linear Spring-Loaded Valve Assembly 1 */}
      <group ref={valve1Ref} name="LINEAR_VALVE_1" position={[-0.35, NOMINAL_VALVE_Y, 0.52]}>
        {/* Valve Retainer Cap */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.06, 20]} />
          <primitive object={materials.anodizedDark} attach="material" />
        </mesh>
        {/* Valve Stem (Linear motion follower) */}
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.65, 20]} />
          <primitive object={materials.polishedChrome} attach="material" />
        </mesh>
        {/* Reciprocating Valve Spring Coils (Stack representation) */}
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.28, 16]} />
          <primitive object={materials.satinSteel} attach="material" />
        </mesh>
      </group>

      {/* 7. Linear Spring-Loaded Valve Assembly 2 */}
      <group ref={valve2Ref} name="LINEAR_VALVE_2" position={[0.35, NOMINAL_VALVE_Y, 0.52]}>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.06, 20]} />
          <primitive object={materials.anodizedDark} attach="material" />
        </mesh>
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.65, 20]} />
          <primitive object={materials.polishedChrome} attach="material" />
        </mesh>
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.28, 16]} />
          <primitive object={materials.satinSteel} attach="material" />
        </mesh>
      </group>

      {/* 8. Stationary Valve Guide Bushings (Mounted to carrier base) */}
      <mesh name="VALVE_GUIDE_BUSHING_1" position={[-0.35, 0.12, 0.52]}>
        <cylinderGeometry args={[0.09, 0.09, 0.42, 20]} />
        <primitive object={materials.matteAluminum} attach="material" />
      </mesh>
      <mesh name="VALVE_GUIDE_BUSHING_2" position={[0.35, 0.12, 0.52]}>
        <cylinderGeometry args={[0.09, 0.09, 0.42, 20]} />
        <primitive object={materials.matteAluminum} attach="material" />
      </mesh>

      {/* 9. Exploded Layer: Camshaft Journal Bearing Caps (Elevate along +Y) */}
      <group ref={bearingCapsRef} name="BEARING_CAPS_GROUP" position={[0, NOMINAL_CAPS_Y, 0]}>
        {/* Left Bearing Cap */}
        <mesh position={[-0.85, 0, 0]}>
          <boxGeometry args={[0.22, 0.16, 0.42]} />
          <primitive object={materials.matteAluminum} attach="material" />
        </mesh>
        {/* Right Bearing Cap */}
        <mesh position={[0.85, 0, 0]}>
          <boxGeometry args={[0.22, 0.16, 0.42]} />
          <primitive object={materials.matteAluminum} attach="material" />
        </mesh>
      </group>

      {/* 10. Exploded Layer: Upper Valve Cover (Elevates along +Y to reveal valvetrain) */}
      <group ref={valveCoverRef} name="UPPER_VALVE_COVER_GROUP" position={[0, NOMINAL_COVER_Y, 0]}>
        <mesh name="VALVE_COVER_TOP">
          <boxGeometry args={[2.3, 0.18, 1.22]} />
          <primitive object={inspectionMaterialInstance.material} attach="material" />
        </mesh>
        {/* Cast Honda VTEC Lettering plate ridge */}
        <mesh position={[0, 0.10, 0]}>
          <boxGeometry args={[1.4, 0.04, 0.48]} />
          <primitive object={materials.castMetal} attach="material" />
        </mesh>
      </group>

      {/* 11. Secondary Valve Guide Bank (Elevates during Architecture/Powertrain) */}
      <group ref={valveBankRef} name="SECONDARY_VALVE_BANK">
        <mesh position={[-0.35, 0.65, -0.32]}>
          <cylinderGeometry args={[0.16, 0.16, 0.72, 24]} />
          <primitive object={materials.matteAluminum} attach="material" />
        </mesh>
        <mesh position={[0.35, 0.65, -0.32]}>
          <cylinderGeometry args={[0.16, 0.16, 0.72, 24]} />
          <primitive object={materials.matteAluminum} attach="material" />
        </mesh>
      </group>
    </group>
  )
}
