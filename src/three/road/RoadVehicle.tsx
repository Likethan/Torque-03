import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { createAccordMaterials } from '../AccordMaterials'
import { getMotionBridgeState } from '../motionBridge'
import { getEnvironmentState } from '../environment/environmentStore'
import {
  sampleRoadPoint,
  sampleRoadBasis,
  sampleRoadCurvature,
  getRoadLength,
} from './roadSpline'
import { prefersReducedMotion } from '../../animation/gsapConfig'
import { dampDt } from '../../motion/lerp'
import { getVehicleState, updateVehicleWheelMotion } from '../vehicle/vehicleStore'

/**
 * ----------------------------------------------------------------------------
 * ROAD VEHICLE ASSEMBLY (Step 11 — Driving / Road Cinematic Sequence)
 * ----------------------------------------------------------------------------
 * Procedural 3D model of the 2003 Honda Accord in motion:
 *
 * 1. Spline Kinematics:
 *    Positioned and oriented strictly along the road spline's orthonormal basis.
 * 2. Authentic 4-Wheel Assembly:
 *    4 independent 16" 7-spoke alloy wheels with rubber tires and ventilated brake discs.
 *    Wheel rotation synchronized directly with physical distance traveled:
 *      wheelAngle = distanceTraveled / wheelRadius (r = 0.32m).
 *    Front wheels steer dynamically into road curvature.
 * 3. Suspension Kinematics:
 *    Centripetal body roll into curves, longitudinal pitch from acceleration,
 *    and subtle road micro-heave.
 * 4. Illuminated Automotive Lighting:
 *    Twin halogen headlights illuminating the road surface ahead, plus red
 *    taillight running glow.
 * 5. Ground Contact:
 *    Tires touch the asphalt at y=0.0m. Ground contact shadow tracks the vehicle.
 */

// Dimensions authentic to 2003 Honda Accord Sedan (7th Gen)
const WHEELBASE = 2.74 // meters
const TRACK_WIDTH = 1.55 // meters
const WHEEL_RADIUS = 0.32 // meters (205/60R16 tire)
const HALF_WB = WHEELBASE / 2
const HALF_TRACK = TRACK_WIDTH / 2

export function RoadVehicle() {
  const rootGroupRef = useRef<THREE.Group>(null)
  const bodyGroupRef = useRef<THREE.Group>(null)

  // 4 Wheel Refs
  const wheelFLRef = useRef<THREE.Group>(null)
  const wheelFRRef = useRef<THREE.Group>(null)
  const wheelRLRef = useRef<THREE.Group>(null)
  const wheelRRRef = useRef<THREE.Group>(null)

  // Steering Pivots (Front Wheels)
  const steerFLRef = useRef<THREE.Group>(null)
  const steerFRRef = useRef<THREE.Group>(null)

  // Dynamic Headlight Spotlights
  const headLightLeftRef = useRef<THREE.SpotLight>(null)
  const headLightRightRef = useRef<THREE.SpotLight>(null)
  const headlightTargetRef = useRef<THREE.Object3D>(null)

  // Tail Light Glow
  const tailLightLeftRef = useRef<THREE.PointLight>(null)
  const tailLightRightRef = useRef<THREE.PointLight>(null)

  const materials = useMemo(() => createAccordMaterials(), [])

  const taillightMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x8a0e1e,
        emissive: new THREE.Color(0xd4142a),
        emissiveIntensity: 0.85,
        roughness: 0.15,
        metalness: 0.1,
      }),
    []
  )

  const contactShadowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      }),
    []
  )

  // Pre-allocated static vectors & matrices (ZERO GC in useFrame)
  const vPos = useMemo(() => new THREE.Vector3(), [])
  const vRight = useMemo(() => new THREE.Vector3(), [])
  const vUp = useMemo(() => new THREE.Vector3(), [])
  const vFwd = useMemo(() => new THREE.Vector3(), [])
  const rotMatrix = useMemo(() => new THREE.Matrix4(), [])
  const basisQuat = useMemo(() => new THREE.Quaternion(), [])

  // Smoothed suspension values
  const smoothedRoll = useRef(0)
  const smoothedPitch = useRef(0)
  const smoothedBounce = useRef(0)
  const smoothedSteer = useRef(0)
  const previousProg = useRef(0)

  // Wheel Spoke Geometry shared across 4 wheels
  const spokeGeom = useMemo(() => new THREE.BoxGeometry(0.024, 0.24, 0.02), [])

  useFrame((_, delta) => {
    const root = rootGroupRef.current
    if (!root) return

    const motion = getMotionBridgeState()
    const roadProg = motion.roadProgress
    const isReduced = prefersReducedMotion()
    const vehicleState = getVehicleState()
    const isDetailActive = vehicleState.activeDetailStudy !== null

    // Visibility: render when in road stage OR when a detail study is active in the studio
    const isVisible = roadProg > 0.001 || motion.cameraMode === 'ROAD' || isDetailActive
    root.visible = isVisible
    if (!isVisible) return

    const dt = Math.min(Math.max(delta, 0.001), 0.1)
    const roadLen = getRoadLength()
    const distanceTraveled = roadProg * roadLen

    const lambda = isReduced ? 24.0 : 8.0

    if (roadProg > 0.001 || motion.cameraMode === 'ROAD') {
      // 1. Evaluate Spline Basis at current road progress
      sampleRoadPoint(roadProg, vPos)
      sampleRoadBasis(roadProg, vRight, vUp, vFwd)

      // Construct rotation matrix from orthonormal basis: Right (X), Up (Y), Forward (Z)
      rotMatrix.makeBasis(vRight, vUp, vFwd)
      basisQuat.setFromRotationMatrix(rotMatrix)

      root.position.copy(vPos)
      root.quaternion.copy(basisQuat)

      // 2. Suspension Dynamics
      const curvature = sampleRoadCurvature(roadProg)
      const progVelocity = (roadProg - previousProg.current) / dt
      previousProg.current = roadProg

      // Approximate speed in m/s based on scroll travel
      const estimatedSpeed = Math.max(Math.abs(progVelocity) * roadLen, 0)

      // Centripetal body roll into curves (Accord double-wishbone roll control)
      const targetRoll = isReduced ? 0 : curvature * Math.min(estimatedSpeed, 35) * 0.18
      // Pitch from acceleration
      const targetPitch = isReduced ? 0 : -progVelocity * 0.08
      // Subtle road micro-heave
      const targetBounce = isReduced ? 0 : Math.sin(distanceTraveled * 4.2) * 0.006

      smoothedRoll.current = dampDt(smoothedRoll.current, targetRoll, lambda, dt)
      smoothedPitch.current = dampDt(smoothedPitch.current, targetPitch, lambda, dt)
      smoothedBounce.current = dampDt(smoothedBounce.current, targetBounce, lambda, dt)

      // 3. Wheel Rotation (synchronized with exact distance traveled)
      const wheelAngle = distanceTraveled / WHEEL_RADIUS

      if (wheelFLRef.current) wheelFLRef.current.rotation.x = wheelAngle
      if (wheelFRRef.current) wheelFRRef.current.rotation.x = wheelAngle
      if (wheelRLRef.current) wheelRLRef.current.rotation.x = wheelAngle
      if (wheelRRRef.current) wheelRRRef.current.rotation.x = wheelAngle

      // 4. Front Wheel Steering Angle
      const targetSteer = isReduced ? 0 : Math.min(Math.max(-curvature * 18.0, -0.38), 0.38)
      smoothedSteer.current = dampDt(smoothedSteer.current, targetSteer, lambda, dt)

      if (steerFLRef.current) steerFLRef.current.rotation.y = smoothedSteer.current
      if (steerFRRef.current) steerFRRef.current.rotation.y = smoothedSteer.current

      // Synchronize vehicle wheel motion to store
      updateVehicleWheelMotion(estimatedSpeed * 3.6, smoothedSteer.current)

      // 5. Headlight Intensity based on environment darkness and road progress
      const env = getEnvironmentState()
      const duskProgress = Math.max(0, (28 - env.sunElevationDeg) / 36)
      const headlightIntensity =
        roadProg > 0.05
          ? Math.min((roadProg - 0.05) / 0.3, 1.0) * (1.6 + duskProgress * 1.8)
          : 0
      if (headLightLeftRef.current) headLightLeftRef.current.intensity = headlightIntensity
      if (headLightRightRef.current) headLightRightRef.current.intensity = headlightIntensity

      // 6. Taillight response: Brighter when decelerating or during blue hour
      const isDecel = progVelocity < -0.01
      const taillightGlow = isDecel ? 1.4 : THREE.MathUtils.lerp(0.4, 0.95, duskProgress)
      if (tailLightLeftRef.current) tailLightLeftRef.current.intensity = taillightGlow
      if (tailLightRightRef.current) tailLightRightRef.current.intensity = taillightGlow
    } else {
      // Studio / Detail Study mode: neutral positioning at origin
      root.position.set(0, 0, 0)
      root.quaternion.identity()

      smoothedRoll.current = dampDt(smoothedRoll.current, 0, lambda, dt)
      smoothedPitch.current = dampDt(smoothedPitch.current, 0, lambda, dt)
      smoothedBounce.current = dampDt(smoothedBounce.current, 0, lambda, dt)
      smoothedSteer.current = dampDt(smoothedSteer.current, 0, lambda, dt)

      if (steerFLRef.current) steerFLRef.current.rotation.y = smoothedSteer.current
      if (steerFRRef.current) steerFRRef.current.rotation.y = smoothedSteer.current

      // Detail Study Headlight & Taillight intensity from vehicle detail store
      const hlIntensity = vehicleState.lighting.headlightIntensity
      if (headLightLeftRef.current) headLightLeftRef.current.intensity = hlIntensity
      if (headLightRightRef.current) headLightRightRef.current.intensity = hlIntensity

      const tlIntensity = vehicleState.lighting.taillightIntensity
      if (tailLightLeftRef.current) tailLightLeftRef.current.intensity = tlIntensity
      if (tailLightRightRef.current) tailLightRightRef.current.intensity = tlIntensity
    }

    if (bodyGroupRef.current) {
      bodyGroupRef.current.position.y = smoothedBounce.current
      bodyGroupRef.current.rotation.z = smoothedRoll.current
      bodyGroupRef.current.rotation.x = smoothedPitch.current
    }

    // Dynamic materials emissive response
    const hlState = vehicleState.lighting.headlightState
    materials.headlightEmitter.emissiveIntensity =
      hlState === 'OFF' ? 0.0 : hlState === 'CINEMATIC' ? 1.9 : hlState === 'ACTIVE' ? 1.35 : 0.65

    const tlState = vehicleState.lighting.taillightState
    materials.taillightJewel.emissiveIntensity =
      tlState === 'OFF' ? 0.05 : tlState === 'CINEMATIC' ? 1.55 : 0.85

    // 7. Surface wetness & shadow response (Step 12 & 13)
    const env = getEnvironmentState()
    contactShadowMat.opacity = THREE.MathUtils.lerp(0.65, 0.88, env.roadWetness)
    materials.satinSilverMetallic.roughness = THREE.MathUtils.lerp(0.24, 0.12, env.roadWetness)
    materials.satinSilverMetallic.metalness = THREE.MathUtils.lerp(0.88, 0.94, env.roadWetness)
    materials.automotiveGlass.roughness = THREE.MathUtils.lerp(0.04, 0.20, env.rainIntensity)
    materials.tireRubber.roughness = THREE.MathUtils.lerp(0.86, 0.55, env.roadWetness)
  })

  return (
    <group ref={rootGroupRef} name="ROAD_VEHICLE_ROOT" visible={false}>
      {/* Target object for directional headlights */}
      <object3D ref={headlightTargetRef} position={[0, 0.4, 25]} />

      {/* ================================================================
          MOVING CONTACT SHADOW — Follows vehicle at road ground level
          ================================================================ */}
      <mesh
        name="VEHICLE_GROUND_CONTACT_SHADOW"
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[2.4, 5.2]} />
        <primitive object={contactShadowMat} attach="material" />
      </mesh>

      {/* ================================================================
          SUSPENDED BODY GROUP — Receives roll, pitch, and heave
          ================================================================ */}
      <group ref={bodyGroupRef} name="VEHICLE_SUSPENDED_BODY" position={[0, WHEEL_RADIUS, 0]}>

        {/* 1. LOWER UNIBODY PLATFORM / CHASSIS FLOOR PAN */}
        <mesh name="CHASSIS_FLOOR_PAN" position={[0, 0.12, 0]}>
          <boxGeometry args={[1.76, 0.18, 4.75]} />
          <primitive object={materials.castMetal} attach="material" />
        </mesh>

        {/* 2. MAIN BODY SHELL — Satin Silver Metallic (NH-623M) */}
        <mesh name="BODY_MAIN_CABIN" position={[0, 0.48, 0]}>
          <boxGeometry args={[1.82, 0.52, 4.65]} />
          <primitive object={materials.satinSilverMetallic} attach="material" />
        </mesh>

        {/* Aerodynamic Hood with center crease */}
        <mesh name="BODY_HOOD" position={[0, 0.62, 1.35]} rotation={[-0.06, 0, 0]}>
          <boxGeometry args={[1.78, 0.14, 1.65]} />
          <primitive object={materials.satinSilverMetallic} attach="material" />
        </mesh>

        {/* Aerodynamic Trunk Lid */}
        <mesh name="BODY_TRUNK" position={[0, 0.68, -1.55]} rotation={[0.04, 0, 0]}>
          <boxGeometry args={[1.74, 0.16, 1.25]} />
          <primitive object={materials.satinSilverMetallic} attach="material" />
        </mesh>

        {/* Aerodynamic Greenhouse / Roof Panel */}
        <mesh name="BODY_ROOF" position={[0, 1.05, -0.15]}>
          <boxGeometry args={[1.52, 0.10, 2.15]} />
          <primitive object={materials.satinSilverMetallic} attach="material" />
        </mesh>

        {/* 3. TINTED AUTOMOTIVE GLASS SURFACES */}
        {/* Windshield */}
        <mesh
          name="WINDSHIELD_GLASS"
          position={[0, 0.86, 0.95]}
          rotation={[-0.56, 0, 0]}
        >
          <planeGeometry args={[1.56, 0.88]} />
          <primitive object={materials.automotiveGlass} attach="material" />
        </mesh>

        {/* Rear Windshield */}
        <mesh
          name="REAR_WINDSHIELD_GLASS"
          position={[0, 0.88, -1.18]}
          rotation={[0.54, 0, 0]}
        >
          <planeGeometry args={[1.52, 0.82]} />
          <primitive object={materials.automotiveGlass} attach="material" />
        </mesh>

        {/* Side Windows - Driver Left */}
        <mesh
          name="SIDE_GLASS_L"
          position={[-0.78, 0.88, -0.15]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <planeGeometry args={[2.1, 0.44]} />
          <primitive object={materials.automotiveGlass} attach="material" />
        </mesh>

        {/* Side Windows - Passenger Right */}
        <mesh
          name="SIDE_GLASS_R"
          position={[0.78, 0.88, -0.15]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <planeGeometry args={[2.1, 0.44]} />
          <primitive object={materials.automotiveGlass} attach="material" />
        </mesh>

        {/* A-Pillars (Framing columns) */}
        <mesh name="A_PILLAR_L" position={[-0.74, 0.86, 0.92]} rotation={[-0.56, 0, 0.12]}>
          <boxGeometry args={[0.07, 0.86, 0.08]} />
          <primitive object={materials.satinSilverMetallic} attach="material" />
        </mesh>
        <mesh name="A_PILLAR_R" position={[0.74, 0.86, 0.92]} rotation={[-0.56, 0, -0.12]}>
          <boxGeometry args={[0.07, 0.86, 0.08]} />
          <primitive object={materials.satinSilverMetallic} attach="material" />
        </mesh>

        {/* 4. FRONT FASCIA & CHROME GRILLE */}
        {/* Pentagonal Chrome Grille */}
        <mesh name="FRONT_CHROME_GRILLE" position={[0, 0.45, 2.34]}>
          <boxGeometry args={[0.78, 0.18, 0.06]} />
          <primitive object={materials.polishedChrome} attach="material" />
        </mesh>
        {/* Grille mesh interior */}
        <mesh name="GRILLE_MESH" position={[0, 0.45, 2.36]}>
          <boxGeometry args={[0.72, 0.14, 0.02]} />
          <primitive object={materials.anodizedDark} attach="material" />
        </mesh>
        {/* Honda 'H' emblem */}
        <mesh name="HONDA_EMBLEM_FRONT" position={[0, 0.45, 2.38]}>
          <boxGeometry args={[0.12, 0.10, 0.02]} />
          <primitive object={materials.polishedChrome} attach="material" />
        </mesh>

        {/* Front Bumper Lower Air Dam */}
        <mesh name="FRONT_LOWER_AIR_DAM" position={[0, 0.22, 2.32]}>
          <boxGeometry args={[1.74, 0.22, 0.18]} />
          <primitive object={materials.satinSilverMetallic} attach="material" />
        </mesh>

        {/* 5. MULTI-REFLECTOR HEADLIGHTS */}
        {/* Left Headlight Bucket */}
        <mesh name="HEADLIGHT_L" position={[-0.68, 0.48, 2.28]} rotation={[0, 0.25, 0]}>
          <boxGeometry args={[0.36, 0.16, 0.14]} />
          <primitive object={materials.headlightHousing} attach="material" />
        </mesh>
        {/* Right Headlight Bucket */}
        <mesh name="HEADLIGHT_R" position={[0.68, 0.48, 2.28]} rotation={[0, -0.25, 0]}>
          <boxGeometry args={[0.36, 0.16, 0.14]} />
          <primitive object={materials.headlightHousing} attach="material" />
        </mesh>

        {/* Halogen Beam Projectors (Illuminating the Road) */}
        <spotLight
          ref={headLightLeftRef}
          position={[-0.65, 0.48, 2.35]}
          color="#fff2d4"
          intensity={0}
          distance={45}
          angle={Math.PI / 7}
          penumbra={0.6}
          target={headlightTargetRef.current ?? undefined}
        />
        <spotLight
          ref={headLightRightRef}
          position={[0.65, 0.48, 2.35]}
          color="#fff2d4"
          intensity={0}
          distance={45}
          angle={Math.PI / 7}
          penumbra={0.6}
          target={headlightTargetRef.current ?? undefined}
        />

        {/* 6. REAR FASCIA & JEWEL TAILLIGHTS */}
        <mesh name="REAR_BUMPER" position={[0, 0.32, -2.32]}>
          <boxGeometry args={[1.78, 0.36, 0.24]} />
          <primitive object={materials.satinSilverMetallic} attach="material" />
        </mesh>

        {/* Dual Jewel Taillight Clusters */}
        <mesh name="TAILLIGHT_L" position={[-0.72, 0.52, -2.34]} rotation={[0, -0.18, 0]}>
          <boxGeometry args={[0.34, 0.18, 0.08]} />
          <primitive object={taillightMat} attach="material" />
        </mesh>
        <mesh name="TAILLIGHT_R" position={[0.72, 0.52, -2.34]} rotation={[0, 0.18, 0]}>
          <boxGeometry args={[0.34, 0.18, 0.08]} />
          <primitive object={taillightMat} attach="material" />
        </mesh>

        {/* Rear Running Glow Lights */}
        <pointLight
          ref={tailLightLeftRef}
          position={[-0.72, 0.52, -2.4]}
          color="#d4142a"
          intensity={0.4}
          distance={4}
        />
        <pointLight
          ref={tailLightRightRef}
          position={[0.72, 0.52, -2.4]}
          color="#d4142a"
          intensity={0.4}
          distance={4}
        />

        {/* Dual Polished Chrome Exhaust Tips */}
        <mesh name="EXHAUST_TIP_L" position={[-0.55, 0.16, -2.38]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.042, 0.042, 0.12, 16]} />
          <primitive object={materials.polishedChrome} attach="material" />
        </mesh>
        <mesh name="EXHAUST_TIP_R" position={[0.55, 0.16, -2.38]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.042, 0.042, 0.12, 16]} />
          <primitive object={materials.polishedChrome} attach="material" />
        </mesh>

        {/* Side Aerodynamic Mirrors with Reflective Glass */}
        <group position={[-0.92, 0.72, 0.88]} rotation={[0, -0.2, 0]}>
          <mesh name="MIRROR_HOUSING_L">
            <boxGeometry args={[0.16, 0.10, 0.08]} />
            <primitive object={materials.satinSilverMetallic} attach="material" />
          </mesh>
          <mesh name="MIRROR_GLASS_L" position={[0.01, 0, -0.041]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.14, 0.08]} />
            <primitive object={materials.mirrorGlass} attach="material" />
          </mesh>
        </group>

        <group position={[0.92, 0.72, 0.88]} rotation={[0, 0.2, 0]}>
          <mesh name="MIRROR_HOUSING_R">
            <boxGeometry args={[0.16, 0.10, 0.08]} />
            <primitive object={materials.satinSilverMetallic} attach="material" />
          </mesh>
          <mesh name="MIRROR_GLASS_R" position={[-0.01, 0, -0.041]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.14, 0.08]} />
            <primitive object={materials.mirrorGlass} attach="material" />
          </mesh>
        </group>

        {/* Flush Chrome Door Handles */}
        <mesh name="DOOR_HANDLE_FL" position={[-0.92, 0.58, 0.42]}>
          <boxGeometry args={[0.025, 0.032, 0.13]} />
          <primitive object={materials.polishedChrome} attach="material" />
        </mesh>
        <mesh name="DOOR_HANDLE_RL" position={[-0.92, 0.58, -0.45]}>
          <boxGeometry args={[0.025, 0.032, 0.13]} />
          <primitive object={materials.polishedChrome} attach="material" />
        </mesh>
        <mesh name="DOOR_HANDLE_FR" position={[0.92, 0.58, 0.42]}>
          <boxGeometry args={[0.025, 0.032, 0.13]} />
          <primitive object={materials.polishedChrome} attach="material" />
        </mesh>
        <mesh name="DOOR_HANDLE_RR" position={[0.92, 0.58, -0.45]}>
          <boxGeometry args={[0.025, 0.032, 0.13]} />
          <primitive object={materials.polishedChrome} attach="material" />
        </mesh>
      </group>

      {/* ================================================================
          4 AUTHENTIC WHEELS — Synchronized rotation with distance traveled
          ================================================================ */}
      {/* FRONT LEFT WHEEL (With Steering Pivot) */}
      <group
        ref={steerFLRef}
        name="STEER_PIVOT_FL"
        position={[-HALF_TRACK, WHEEL_RADIUS, HALF_WB]}
      >
        <group ref={wheelFLRef} name="WHEEL_ROTATION_FL">
          <WheelAssembly
            tireMat={materials.tireRubber}
            rimMat={materials.satinSteel}
            rotorMat={materials.brakeRotor}
            caliperMat={materials.brakeCaliper}
            spokeGeom={spokeGeom}
            isLeft
          />
        </group>
      </group>

      {/* FRONT RIGHT WHEEL (With Steering Pivot) */}
      <group
        ref={steerFRRef}
        name="STEER_PIVOT_FR"
        position={[HALF_TRACK, WHEEL_RADIUS, HALF_WB]}
      >
        <group ref={wheelFRRef} name="WHEEL_ROTATION_FR">
          <WheelAssembly
            tireMat={materials.tireRubber}
            rimMat={materials.satinSteel}
            rotorMat={materials.brakeRotor}
            caliperMat={materials.brakeCaliper}
            spokeGeom={spokeGeom}
            isLeft={false}
          />
        </group>
      </group>

      {/* REAR LEFT WHEEL */}
      <group
        name="WHEEL_MOUNT_RL"
        position={[-HALF_TRACK, WHEEL_RADIUS, -HALF_WB]}
      >
        <group ref={wheelRLRef} name="WHEEL_ROTATION_RL">
          <WheelAssembly
            tireMat={materials.tireRubber}
            rimMat={materials.satinSteel}
            rotorMat={materials.brakeRotor}
            caliperMat={materials.brakeCaliper}
            spokeGeom={spokeGeom}
            isLeft
          />
        </group>
      </group>

      {/* REAR RIGHT WHEEL */}
      <group
        name="WHEEL_MOUNT_RR"
        position={[HALF_TRACK, WHEEL_RADIUS, -HALF_WB]}
      >
        <group ref={wheelRRRef} name="WHEEL_ROTATION_RR">
          <WheelAssembly
            tireMat={materials.tireRubber}
            rimMat={materials.satinSteel}
            rotorMat={materials.brakeRotor}
            caliperMat={materials.brakeCaliper}
            spokeGeom={spokeGeom}
            isLeft={false}
          />
        </group>
      </group>
    </group>
  )
}

/**
 * Procedural 16" 7-spoke alloy wheel assembly:
 * - Torus rubber tire
 * - Cylindrical alloy rim barrel
 * - 7 radial spokes
 * - Ventilated brake rotor + dark caliper
 */
function WheelAssembly({
  tireMat,
  rimMat,
  rotorMat,
  caliperMat,
  spokeGeom,
  isLeft,
}: {
  tireMat: THREE.Material
  rimMat: THREE.Material
  rotorMat: THREE.Material
  caliperMat: THREE.Material
  spokeGeom: THREE.BufferGeometry
  isLeft: boolean
}) {
  const rotY = isLeft ? Math.PI / 2 : -Math.PI / 2

  return (
    <group rotation={[0, rotY, 0]}>
      {/* 1. Rubber Tire */}
      <mesh name="TIRE_RUBBER">
        <torusGeometry args={[WHEEL_RADIUS - 0.08, 0.08, 16, 32]} />
        <primitive object={tireMat} attach="material" />
      </mesh>

      {/* 2. Rim Barrel */}
      <mesh name="RIM_BARREL" rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.23, 0.23, 0.16, 24]} />
        <primitive object={rimMat} attach="material" />
      </mesh>

      {/* 3. Center Hub Cap */}
      <mesh name="RIM_CENTER_HUB" position={[0, 0, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.04, 16]} />
        <primitive object={rimMat} attach="material" />
      </mesh>

      {/* 4. 7 Radial Alloy Spokes */}
      {Array.from({ length: 7 }).map((_, idx) => {
        const angle = (idx * Math.PI * 2) / 7
        return (
          <mesh
            key={idx}
            geometry={spokeGeom}
            material={rimMat}
            position={[Math.cos(angle) * 0.11, Math.sin(angle) * 0.11, 0.06]}
            rotation={[0, 0, angle + Math.PI / 2]}
          />
        )
      })}

      {/* 5. Ventilated Steel Brake Rotor (Behind Rim) */}
      <mesh name="BRAKE_ROTOR" position={[0, 0, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.015, 24]} />
        <primitive object={rotorMat} attach="material" />
      </mesh>

      {/* 6. Brake Caliper */}
      <mesh name="BRAKE_CALIPER" position={[0, 0.13, -0.02]}>
        <boxGeometry args={[0.05, 0.07, 0.045]} />
        <primitive object={caliperMat} attach="material" />
      </mesh>
    </group>
  )
}
