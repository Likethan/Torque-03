import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { createInteriorMaterials } from './interiorMaterials'
import { createAccordMaterials } from '../AccordMaterials'
import { getMotionBridgeState } from '../motionBridge'
import { selectInteriorTarget, setInteriorHovered } from './interiorStore'
import { prefersReducedMotion } from '../../animation/gsapConfig'
import { dampDt } from '../../motion/lerp'

/**
 * ----------------------------------------------------------------------------
 * INTERIOR CABIN ASSEMBLY (Step 10 — Interior Camera Transition)
 * ----------------------------------------------------------------------------
 * Procedural 3D geometry representing the 2003 Honda Accord 7th-generation
 * cabin interior, constructed from Three.js primitives with premium PBR
 * materials.
 *
 * Matches the existing engineering assembly's level of geometric abstraction:
 * clean primitives (boxes, cylinders, tori) with authentic material properties
 * creating a recognizable architectural impression of the cabin.
 *
 * The cabin is positioned forward (+Z) of the engineering assembly origin,
 * representing the passenger compartment's spatial relationship to the
 * powertrain.
 *
 * Key Interior Landmarks (authentic to 2003 Accord):
 * - Dashboard with horizontal emphasis and integrated defroster vents
 * - 3-spoke leather-trimmed steering wheel with tilt column
 * - Electro-luminescent instrument cluster
 * - Tiered center console with climate controls and CD changer
 * - Front bucket seats with adjustable lumbar
 * - A-pillars framing the windshield
 * - Laminated UV-protection windshield
 * - Headliner and floor surfaces
 *
 * Conditional rendering: geometry only appears when interiorProgress > 0.02
 * to avoid unnecessary draw calls during exterior viewing.
 */
export function InteriorCabin() {
  const groupRef = useRef<THREE.Group>(null)

  const materials = useMemo(() => createInteriorMaterials(), [])
  const exteriorMats = useMemo(() => createAccordMaterials(), [])

  // Smoothed visibility opacity
  const smoothedOpacity = useRef(0)

  // Instrument cluster emissive intensity
  const clusterEmissive = useRef(0)

  useFrame((_, delta) => {
    const dt = Math.min(Math.max(delta, 0.001), 0.1)
    const motion = getMotionBridgeState()
    const isReduced = prefersReducedMotion()
    const interiorProg = motion.interiorProgress

    // Smooth visibility transition
    const targetOpacity = interiorProg > 0.02 ? 1.0 : 0.0
    const lambda = isReduced ? 20.0 : 6.0
    smoothedOpacity.current = dampDt(smoothedOpacity.current, targetOpacity, lambda, dt)

    // Instrument cluster glow ramps up when inside cabin
    const targetClusterGlow = interiorProg > 0.4 ? Math.min((interiorProg - 0.4) / 0.2, 1.0) * 0.65 : 0
    clusterEmissive.current = dampDt(clusterEmissive.current, targetClusterGlow, 4.0, dt)
    materials.instrumentFace.emissiveIntensity = clusterEmissive.current

    // Toggle visibility
    if (groupRef.current) {
      groupRef.current.visible = smoothedOpacity.current > 0.01
    }
  })

  // Interaction handlers
  const handleClick = (targetId: string) => (e: THREE.Event) => {
    if (e && 'stopPropagation' in e) (e as any).stopPropagation()
    selectInteriorTarget(targetId)
  }
  const handleHover = (targetId: string) => (e: THREE.Event) => {
    if (e && 'stopPropagation' in e) (e as any).stopPropagation()
    setInteriorHovered(targetId)
  }
  const handleUnhover = (e: THREE.Event) => {
    if (e && 'stopPropagation' in e) (e as any).stopPropagation()
    setInteriorHovered(null)
  }

  return (
    <group ref={groupRef} name="INTERIOR_CABIN_ASSEMBLY" position={[0, 0, 3.5]} visible={false}>

      {/* ================================================================
          1. DASHBOARD — Wide horizontal surface with depth
          ================================================================ */}
      <group
        name="DASHBOARD_GROUP"
        onClick={handleClick('TARGET_DASHBOARD') as any}
        onPointerOver={handleHover('TARGET_DASHBOARD') as any}
        onPointerOut={handleUnhover as any}
      >
        {/* Main dashboard body */}
        <mesh name="DASHBOARD_MAIN" position={[0, 0.82, 2.1]}>
          <boxGeometry args={[2.2, 0.35, 0.85]} />
          <primitive object={materials.dashboardSoftTouch} attach="material" />
        </mesh>
        {/* Dashboard top surface (defroster shelf) */}
        <mesh name="DASHBOARD_TOP" position={[0, 1.02, 2.15]}>
          <boxGeometry args={[2.1, 0.06, 0.75]} />
          <primitive object={materials.dashboardSoftTouch} attach="material" />
        </mesh>
        {/* Center stack fascia */}
        <mesh name="CENTER_STACK" position={[0.15, 0.72, 1.95]}>
          <boxGeometry args={[0.55, 0.42, 0.22]} />
          <primitive object={materials.consolePlastic} attach="material" />
        </mesh>
        {/* Wood-grain accent trim strip */}
        <mesh name="DASH_WOOD_ACCENT" position={[0, 0.66, 2.0]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[1.8, 0.035, 0.12]} />
          <primitive object={materials.woodGrainAccent} attach="material" />
        </mesh>
      </group>

      {/* ================================================================
          2. INSTRUMENT CLUSTER — Recessed gauge panel
          ================================================================ */}
      <group
        name="CLUSTER_GROUP"
        onClick={handleClick('TARGET_CLUSTER') as any}
        onPointerOver={handleHover('TARGET_CLUSTER') as any}
        onPointerOut={handleUnhover as any}
      >
        {/* Cluster housing recess */}
        <mesh name="CLUSTER_HOUSING" position={[-0.12, 0.92, 2.25]}>
          <boxGeometry args={[0.65, 0.28, 0.15]} />
          <primitive object={materials.consolePlastic} attach="material" />
        </mesh>
        {/* Instrument face (emissive gauges) */}
        <mesh name="CLUSTER_FACE" position={[-0.12, 0.92, 2.18]}>
          <boxGeometry args={[0.58, 0.22, 0.02]} />
          <primitive object={materials.instrumentFace} attach="material" />
        </mesh>
        {/* Cluster glass cover */}
        <mesh name="CLUSTER_GLASS" position={[-0.12, 0.92, 2.16]}>
          <boxGeometry args={[0.60, 0.24, 0.01]} />
          <primitive object={materials.instrumentGlass} attach="material" />
        </mesh>
        {/* Cluster hood visor */}
        <mesh name="CLUSTER_VISOR" position={[-0.12, 1.06, 2.22]} rotation={[-0.25, 0, 0]}>
          <boxGeometry args={[0.68, 0.06, 0.18]} />
          <primitive object={materials.dashboardSoftTouch} attach="material" />
        </mesh>
      </group>

      {/* ================================================================
          3. STEERING WHEEL — 3-spoke torus with column
          ================================================================ */}
      <group
        name="STEERING_GROUP"
        onClick={handleClick('TARGET_STEERING') as any}
        onPointerOver={handleHover('TARGET_STEERING') as any}
        onPointerOut={handleUnhover as any}
      >
        {/* Steering wheel rim (torus) */}
        <mesh
          name="STEERING_WHEEL_RIM"
          position={[-0.12, 0.88, 1.65]}
          rotation={[1.15, 0, 0]}
        >
          <torusGeometry args={[0.19, 0.022, 16, 32]} />
          <primitive object={materials.steeringLeather} attach="material" />
        </mesh>
        {/* Steering column */}
        <mesh
          name="STEERING_COLUMN"
          position={[-0.12, 0.72, 1.88]}
          rotation={[1.15, 0, 0]}
        >
          <cylinderGeometry args={[0.035, 0.04, 0.55, 16]} />
          <primitive object={materials.consolePlastic} attach="material" />
        </mesh>
        {/* Center hub / airbag cover */}
        <mesh
          name="STEERING_HUB"
          position={[-0.12, 0.88, 1.65]}
          rotation={[1.15, 0, 0]}
        >
          <cylinderGeometry args={[0.065, 0.065, 0.04, 20]} />
          <primitive object={materials.dashboardSoftTouch} attach="material" />
        </mesh>
        {/* Honda badge accent on hub */}
        <mesh
          name="STEERING_BADGE"
          position={[-0.12, 0.88, 1.63]}
          rotation={[1.15, 0, 0]}
        >
          <cylinderGeometry args={[0.02, 0.02, 0.015, 12]} />
          <primitive object={exteriorMats.polishedChrome} attach="material" />
        </mesh>
      </group>

      {/* ================================================================
          4. CENTER CONSOLE — Tiered console ridge with shift knob
          ================================================================ */}
      <group
        name="CONSOLE_GROUP"
        onClick={handleClick('TARGET_CONSOLE') as any}
        onPointerOver={handleHover('TARGET_CONSOLE') as any}
        onPointerOut={handleUnhover as any}
      >
        {/* Console body */}
        <mesh name="CONSOLE_BODY" position={[0.18, 0.52, 1.3]}>
          <boxGeometry args={[0.42, 0.32, 1.2]} />
          <primitive object={materials.consolePlastic} attach="material" />
        </mesh>
        {/* Console armrest */}
        <mesh name="CONSOLE_ARMREST" position={[0.18, 0.70, 0.9]}>
          <boxGeometry args={[0.35, 0.06, 0.45]} />
          <primitive object={materials.seatLeather} attach="material" />
        </mesh>
        {/* Gear selector gate */}
        <mesh name="GEAR_SELECTOR" position={[0.18, 0.68, 1.45]}>
          <boxGeometry args={[0.18, 0.04, 0.25]} />
          <primitive object={materials.interiorAluminumTrim} attach="material" />
        </mesh>
        {/* Shift knob */}
        <mesh name="SHIFT_KNOB" position={[0.18, 0.74, 1.45]}>
          <sphereGeometry args={[0.028, 12, 12]} />
          <primitive object={materials.steeringLeather} attach="material" />
        </mesh>
        {/* Console wood accent */}
        <mesh name="CONSOLE_WOOD" position={[0.18, 0.62, 1.48]}>
          <boxGeometry args={[0.32, 0.03, 0.22]} />
          <primitive object={materials.woodGrainAccent} attach="material" />
        </mesh>
      </group>

      {/* ================================================================
          5. DRIVER SEAT — Simplified bucket seat geometry
          ================================================================ */}
      <group name="DRIVER_SEAT_GROUP">
        {/* Seat cushion */}
        <mesh name="DRIVER_SEAT_BASE" position={[-0.38, 0.42, 1.0]}>
          <boxGeometry args={[0.52, 0.14, 0.55]} />
          <primitive object={materials.seatLeather} attach="material" />
        </mesh>
        {/* Seat backrest */}
        <mesh name="DRIVER_SEAT_BACK" position={[-0.38, 0.82, 0.68]} rotation={[-0.18, 0, 0]}>
          <boxGeometry args={[0.48, 0.62, 0.12]} />
          <primitive object={materials.seatLeather} attach="material" />
        </mesh>
        {/* Headrest */}
        <mesh name="DRIVER_HEADREST" position={[-0.38, 1.18, 0.62]}>
          <boxGeometry args={[0.22, 0.16, 0.08]} />
          <primitive object={materials.seatLeather} attach="material" />
        </mesh>
      </group>

      {/* ================================================================
          6. PASSENGER SEAT — Mirror of driver seat
          ================================================================ */}
      <group name="PASSENGER_SEAT_GROUP">
        <mesh name="PASSENGER_SEAT_BASE" position={[0.58, 0.42, 1.0]}>
          <boxGeometry args={[0.52, 0.14, 0.55]} />
          <primitive object={materials.seatLeather} attach="material" />
        </mesh>
        <mesh name="PASSENGER_SEAT_BACK" position={[0.58, 0.82, 0.68]} rotation={[-0.18, 0, 0]}>
          <boxGeometry args={[0.48, 0.62, 0.12]} />
          <primitive object={materials.seatLeather} attach="material" />
        </mesh>
        <mesh name="PASSENGER_HEADREST" position={[0.58, 1.18, 0.62]}>
          <boxGeometry args={[0.22, 0.16, 0.08]} />
          <primitive object={materials.seatLeather} attach="material" />
        </mesh>
      </group>

      {/* ================================================================
          7. A-PILLARS — Structural windshield frame columns
          ================================================================ */}
      {/* Left A-pillar (driver side) */}
      <mesh name="A_PILLAR_LEFT" position={[-1.0, 1.15, 2.6]} rotation={[0.35, 0.12, -0.15]}>
        <boxGeometry args={[0.08, 0.65, 0.08]} />
        <primitive object={materials.pillarTrim} attach="material" />
      </mesh>
      {/* Right A-pillar (passenger side) */}
      <mesh name="A_PILLAR_RIGHT" position={[1.0, 1.15, 2.6]} rotation={[0.35, -0.12, 0.15]}>
        <boxGeometry args={[0.08, 0.65, 0.08]} />
        <primitive object={materials.pillarTrim} attach="material" />
      </mesh>

      {/* ================================================================
          8. WINDSHIELD — Angled transparent glass plane
          ================================================================ */}
      <mesh
        name="WINDSHIELD_GLASS"
        position={[0, 1.22, 2.85]}
        rotation={[1.18, 0, 0]}
      >
        <planeGeometry args={[2.0, 0.95]} />
        <primitive object={exteriorMats.automotiveGlass} attach="material" />
      </mesh>

      {/* ================================================================
          9. HEADLINER — Overhead cabin surface
          ================================================================ */}
      <mesh name="HEADLINER" position={[0, 1.52, 1.6]}>
        <boxGeometry args={[2.0, 0.04, 2.2]} />
        <primitive object={materials.headlinerFabric} attach="material" />
      </mesh>

      {/* ================================================================
          10. FLOOR — Dark carpet surface
          ================================================================ */}
      <mesh name="CABIN_FLOOR" position={[0, 0.28, 1.4]}>
        <boxGeometry args={[2.0, 0.04, 2.4]} />
        <primitive object={materials.carpetFloor} attach="material" />
      </mesh>

      {/* ================================================================
          11. DOOR PANELS — Simplified side surfaces
          ================================================================ */}
      {/* Driver door panel */}
      <mesh name="DOOR_PANEL_LEFT" position={[-1.05, 0.72, 1.4]}>
        <boxGeometry args={[0.05, 0.65, 1.6]} />
        <primitive object={materials.doorPanelFabric} attach="material" />
      </mesh>
      {/* Driver door armrest */}
      <mesh name="DOOR_ARMREST_LEFT" position={[-1.0, 0.68, 1.3]}>
        <boxGeometry args={[0.10, 0.06, 0.45]} />
        <primitive object={materials.seatLeather} attach="material" />
      </mesh>
      {/* Passenger door panel */}
      <mesh name="DOOR_PANEL_RIGHT" position={[1.05, 0.72, 1.4]}>
        <boxGeometry args={[0.05, 0.65, 1.6]} />
        <primitive object={materials.doorPanelFabric} attach="material" />
      </mesh>
      {/* Passenger door armrest */}
      <mesh name="DOOR_ARMREST_RIGHT" position={[1.0, 0.68, 1.3]}>
        <boxGeometry args={[0.10, 0.06, 0.45]} />
        <primitive object={materials.seatLeather} attach="material" />
      </mesh>

      {/* ================================================================
          12. REAR-VIEW MIRROR — Small bracket on windshield header
          ================================================================ */}
      <mesh name="REARVIEW_BRACKET" position={[0, 1.42, 2.55]}>
        <boxGeometry args={[0.04, 0.10, 0.04]} />
        <primitive object={materials.consolePlastic} attach="material" />
      </mesh>
      <mesh name="REARVIEW_MIRROR" position={[0, 1.35, 2.52]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.22, 0.06, 0.04]} />
        <primitive object={materials.consolePlastic} attach="material" />
      </mesh>

      {/* ================================================================
          13. ALUMINUM TRIM ACCENTS — Door and dash trim rings
          ================================================================ */}
      {/* Speaker trim ring - driver door */}
      <mesh name="SPEAKER_TRIM_L" position={[-1.01, 0.52, 1.7]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.06, 0.008, 8, 16]} />
        <primitive object={materials.interiorAluminumTrim} attach="material" />
      </mesh>
      {/* Vent trim rings - left */}
      <mesh name="VENT_TRIM_L" position={[-0.65, 0.98, 2.06]} rotation={[0.08, 0, 0]}>
        <torusGeometry args={[0.045, 0.006, 8, 16]} />
        <primitive object={materials.interiorAluminumTrim} attach="material" />
      </mesh>
      {/* Vent trim rings - right */}
      <mesh name="VENT_TRIM_R" position={[0.65, 0.98, 2.06]} rotation={[0.08, 0, 0]}>
        <torusGeometry args={[0.045, 0.006, 8, 16]} />
        <primitive object={materials.interiorAluminumTrim} attach="material" />
      </mesh>
    </group>
  )
}
