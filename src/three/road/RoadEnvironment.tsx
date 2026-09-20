import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { getMotionBridgeState } from '../motionBridge'
import { getEnvironmentState } from '../environment/environmentStore'
import {
  sampleRoadPoint,
  sampleRoadBasis,
  sampleRoadCurvature,
  getRoadLength,
} from './roadSpline'
import { getQualityConfig } from '../qualityTiers'

/**
 * ----------------------------------------------------------------------------
 * ROAD ENVIRONMENT (Step 11 — Driving / Road Cinematic Sequence)
 * ----------------------------------------------------------------------------
 * Controlled cinematic highway environment:
 *
 * 1. Procedural Ribbon Asphalt:
 *    Two-lane highway (8.0m width) sampled directly from the 450m 3D spline.
 *    High-performance PBR dark asphalt with dynamic Step 12 wetness response.
 * 2. Painted Road Markings:
 *    Solid white shoulder boundaries and dashed yellow/white center divider.
 * 3. Highway Guardrails:
 *    Curved galvanized steel W-beam safety barriers with vertical stanchions
 *    along the sweeping curve sections.
 * 4. Highway Luminaire Poles:
 *    Minimalist cantilever light poles placed at 45m intervals with subtle
 *    localized downward amber pools.
 * 5. Multi-Layered Roadside Parallax:
 *    - Foreground: Guardrails, delineator posts, road reflectors
 *    - Midground: Minimalist roadside tree silhouettes with wind sway
 *    - Background: Low-poly rolling misty ridges framing the twilight horizon
 *
 * Visibility: Only renders when in or entering road mode (zero overhead elsewhere).
 */

const ROAD_WIDTH = 8.0 // meters
const HALF_ROAD = ROAD_WIDTH / 2
const SEGMENTS = 160 // along spline

export function RoadEnvironment() {
  const groupRef = useRef<THREE.Group>(null)
  const treeRefs = useRef<(THREE.Group | null)[]>([])
  const quality = useMemo(() => getQualityConfig(), [])

  // 1. Procedural Road Ribbon Geometry
  const { roadGeom, leftLineGeom, rightLineGeom, centerLineGeom } = useMemo(() => {
    const roadLen = getRoadLength()

    // Vectors for sampling
    const pos = new THREE.Vector3()
    const right = new THREE.Vector3()
    const up = new THREE.Vector3()
    const fwd = new THREE.Vector3()

    // Arrays for Main Asphalt Mesh
    const positions: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    // Arrays for Left White Shoulder Stripe (0.14m wide)
    const posLeftLine: number[] = []
    const indLeftLine: number[] = []

    // Arrays for Right White Shoulder Stripe (0.14m wide)
    const posRightLine: number[] = []
    const indRightLine: number[] = []

    // Arrays for Center Dashed Line (0.14m wide, 4m dash, 4m gap)
    const posCenterLine: number[] = []
    const indCenterLine: number[] = []

    let centerQuadIndex = 0

    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS
      sampleRoadPoint(t, pos)
      sampleRoadBasis(t, right, up, fwd)

      // Main Road Surface Vertices (Left & Right)
      const lx = pos.x - right.x * HALF_ROAD
      const ly = pos.y - right.y * HALF_ROAD
      const lz = pos.z - right.z * HALF_ROAD

      const rx = pos.x + right.x * HALF_ROAD
      const ry = pos.y + right.y * HALF_ROAD
      const rz = pos.z + right.z * HALF_ROAD

      positions.push(lx, ly, lz, rx, ry, rz)
      normals.push(up.x, up.y, up.z, up.x, up.y, up.z)
      uvs.push(0, t * (roadLen / 12), 1, t * (roadLen / 12))

      if (i < SEGMENTS) {
        const base = i * 2
        indices.push(base, base + 1, base + 2)
        indices.push(base + 1, base + 3, base + 2)
      }

      // Left Edge White Stripe (offset -3.85m to -3.71m)
      const edgeL1 = pos.clone().addScaledVector(right, -HALF_ROAD + 0.15).addScaledVector(up, 0.003)
      const edgeL2 = pos.clone().addScaledVector(right, -HALF_ROAD + 0.29).addScaledVector(up, 0.003)
      posLeftLine.push(edgeL1.x, edgeL1.y, edgeL1.z, edgeL2.x, edgeL2.y, edgeL2.z)

      if (i < SEGMENTS) {
        const lBase = i * 2
        indLeftLine.push(lBase, lBase + 1, lBase + 2)
        indLeftLine.push(lBase + 1, lBase + 3, lBase + 2)
      }

      // Right Edge White Stripe (offset +3.71m to +3.85m)
      const edgeR1 = pos.clone().addScaledVector(right, HALF_ROAD - 0.29).addScaledVector(up, 0.003)
      const edgeR2 = pos.clone().addScaledVector(right, HALF_ROAD - 0.15).addScaledVector(up, 0.003)
      posRightLine.push(edgeR1.x, edgeR1.y, edgeR1.z, edgeR2.x, edgeR2.y, edgeR2.z)

      if (i < SEGMENTS) {
        const rBase = i * 2
        indRightLine.push(rBase, rBase + 1, rBase + 2)
        indRightLine.push(rBase + 1, rBase + 3, rBase + 2)
      }

      // Center Dashed Stripe (3.5m line, 3.5m gap)
      const dist = t * roadLen
      const isDash = Math.floor(dist / 3.8) % 2 === 0
      if (isDash && i < SEGMENTS) {
        const c1 = pos.clone().addScaledVector(right, -0.07).addScaledVector(up, 0.004)
        const c2 = pos.clone().addScaledVector(right, 0.07).addScaledVector(up, 0.004)

        sampleRoadPoint((i + 1) / SEGMENTS, pos)
        sampleRoadBasis((i + 1) / SEGMENTS, right, up, fwd)

        const c3 = pos.clone().addScaledVector(right, -0.07).addScaledVector(up, 0.004)
        const c4 = pos.clone().addScaledVector(right, 0.07).addScaledVector(up, 0.004)

        posCenterLine.push(c1.x, c1.y, c1.z, c2.x, c2.y, c2.z, c3.x, c3.y, c3.z, c4.x, c4.y, c4.z)
        const cBase = centerQuadIndex * 4
        indCenterLine.push(cBase, cBase + 1, cBase + 2)
        indCenterLine.push(cBase + 1, cBase + 3, cBase + 2)
        centerQuadIndex++
      }
    }

    // Main Road Geometry
    const rGeom = new THREE.BufferGeometry()
    rGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    rGeom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    rGeom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    rGeom.setIndex(indices)

    // Left Line
    const llGeom = new THREE.BufferGeometry()
    llGeom.setAttribute('position', new THREE.Float32BufferAttribute(posLeftLine, 3))
    llGeom.setIndex(indLeftLine)
    llGeom.computeVertexNormals()

    // Right Line
    const rlGeom = new THREE.BufferGeometry()
    rlGeom.setAttribute('position', new THREE.Float32BufferAttribute(posRightLine, 3))
    rlGeom.setIndex(indRightLine)
    rlGeom.computeVertexNormals()

    // Center Line
    const clGeom = new THREE.BufferGeometry()
    clGeom.setAttribute('position', new THREE.Float32BufferAttribute(posCenterLine, 3))
    clGeom.setIndex(indCenterLine)
    clGeom.computeVertexNormals()

    return { roadGeom: rGeom, leftLineGeom: llGeom, rightLineGeom: rlGeom, centerLineGeom: clGeom }
  }, [])

  // 2. Highway Light Poles & Guardrails along spline
  const { lightPoles, guardrails } = useMemo(() => {
    const poles: { position: [number, number, number]; rotationY: number }[] = []
    const rails: { position: [number, number, number]; rotationY: number; length: number }[] = []

    const pos = new THREE.Vector3()
    const right = new THREE.Vector3()
    const up = new THREE.Vector3()
    const fwd = new THREE.Vector3()

    // Light poles placed every 42 meters along the outer curve side
    const poleCount = quality.tier === 'LOW' ? 6 : 11
    for (let i = 1; i <= poleCount; i++) {
      const t = i / (poleCount + 1)
      sampleRoadPoint(t, pos)
      sampleRoadBasis(t, right, up, fwd)

      // Alternate left/right side of highway
      const sideSign = i % 2 === 0 ? 1 : -1
      const polePos = pos.clone().addScaledVector(right, (HALF_ROAD + 1.6) * sideSign)
      const rotY = Math.atan2(fwd.x, fwd.z)

      poles.push({
        position: [polePos.x, polePos.y, polePos.z],
        rotationY: rotY + (sideSign < 0 ? 0 : Math.PI),
      })
    }

    // Guardrail segments along curved sections (P2-P3 left, P5-P6 right)
    const railSteps = quality.tier === 'LOW' ? 14 : 28
    for (let i = 0; i < railSteps; i++) {
      const t = 0.12 + (i / railSteps) * 0.72
      const curv = sampleRoadCurvature(t)
      if (Math.abs(curv) > 0.0003) {
        sampleRoadPoint(t, pos)
        sampleRoadBasis(t, right, up, fwd)

        const sideSign = curv > 0 ? -1 : 1
        const railPos = pos.clone().addScaledVector(right, (HALF_ROAD + 0.35) * sideSign)
        const rotY = Math.atan2(fwd.x, fwd.z)

        rails.push({
          position: [railPos.x, railPos.y + 0.38, railPos.z],
          rotationY: rotY,
          length: 12.0,
        })
      }
    }

    return { lightPoles: poles, guardrails: rails }
  }, [quality.tier])

  // 3. Roadside Trees for Midground Parallax
  const roadsideTrees = useMemo(() => {
    if (quality.tier === 'LOW') return []
    const trees: [number, number, number][] = []
    const pos = new THREE.Vector3()
    const right = new THREE.Vector3()
    const up = new THREE.Vector3()
    const fwd = new THREE.Vector3()

    const count = 18
    for (let i = 0; i < count; i++) {
      const t = 0.08 + (i / count) * 0.85
      sampleRoadPoint(t, pos)
      sampleRoadBasis(t, right, up, fwd)

      const distOffset = (i % 2 === 0 ? 1 : -1) * (HALF_ROAD + 6.0 + (i % 5) * 3.5)
      const treePos = pos.clone().addScaledVector(right, distOffset)
      trees.push([treePos.x, treePos.y, treePos.z])
    }
    return trees
  }, [quality.tier])

  // Materials
  const asphaltMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x14181f,
        roughness: 0.82,
        metalness: 0.12,
      }),
    []
  )

  const lineMarkingMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xe0e6ed,
      }),
    []
  )

  const centerLineMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xf5cf42,
      }),
    []
  )

  const guardrailMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x8a929e,
        roughness: 0.32,
        metalness: 0.88,
      }),
    []
  )

  const poleMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x22262e,
        roughness: 0.45,
        metalness: 0.75,
      }),
    []
  )

  const treeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x12171c,
        roughness: 0.9,
        metalness: 0.05,
      }),
    []
  )

  useFrame((state) => {
    const group = groupRef.current
    if (!group) return

    const motion = getMotionBridgeState()
    const isVisible = motion.roadProgress > 0.001 || motion.cameraMode === 'ROAD'
    group.visible = isVisible
    if (!isVisible) return

    // Step 12: Dynamic Road Wetness PBR Reaction
    const env = getEnvironmentState()
    const wetness = env.roadWetness
    asphaltMat.roughness = THREE.MathUtils.lerp(0.82, 0.28, wetness)
    asphaltMat.metalness = THREE.MathUtils.lerp(0.12, 0.45, wetness)

    // Step 12: Coherent Tree Wind Sway
    const wind = env.windIntensity
    if (treeRefs.current.length > 0 && wind > 0.05) {
      const time = state.clock.getElapsedTime()
      for (let i = 0; i < treeRefs.current.length; i++) {
        const tree = treeRefs.current[i]
        if (tree) {
          tree.rotation.z = Math.sin(time * 2.2 + i * 0.7) * wind * 0.05
          tree.rotation.x = Math.cos(time * 1.8 + i * 0.5) * wind * 0.03
        }
      }
    }
  })

  return (
    <group ref={groupRef} name="ROAD_ENVIRONMENT_ROOT" visible={false}>
      {/* 1. Main Asphalt Highway Ribbon */}
      <mesh geometry={roadGeom} material={asphaltMat} receiveShadow />

      {/* 2. Painted Road Markings */}
      <mesh geometry={leftLineGeom} material={lineMarkingMat} />
      <mesh geometry={rightLineGeom} material={lineMarkingMat} />
      <mesh geometry={centerLineGeom} material={centerLineMat} />

      {/* 3. Highway Guardrails along Curves */}
      {guardrails.map((rail, idx) => (
        <group key={idx} position={rail.position} rotation={[0, rail.rotationY, 0]}>
          <mesh material={guardrailMat}>
            <boxGeometry args={[0.08, 0.28, 4.2]} />
          </mesh>
          <mesh position={[0, -0.22, 0]} material={poleMat}>
            <cylinderGeometry args={[0.04, 0.04, 0.45, 8]} />
          </mesh>
        </group>
      ))}

      {/* 4. Highway Luminaire Light Poles */}
      {lightPoles.map((pole, idx) => (
        <group key={idx} position={pole.position} rotation={[0, pole.rotationY, 0]}>
          {/* Vertical Pole Mast (6.5m height) */}
          <mesh position={[0, 3.25, 0]} material={poleMat}>
            <cylinderGeometry args={[0.09, 0.12, 6.5, 12]} />
          </mesh>
          {/* Curved Arm reaching toward road */}
          <mesh position={[1.0, 6.3, 0]} rotation={[0, 0, -0.3]} material={poleMat}>
            <boxGeometry args={[2.2, 0.08, 0.08]} />
          </mesh>
          {/* Luminaire Head */}
          <mesh position={[2.0, 6.1, 0]} material={poleMat}>
            <boxGeometry args={[0.55, 0.10, 0.22]} />
          </mesh>
          {/* Subtle Downlight Pool */}
          <pointLight
            position={[2.0, 5.8, 0]}
            color="#fff0d0"
            intensity={0.35}
            distance={18}
            decay={2.0}
          />
        </group>
      ))}

      {/* 5. Minimalist Roadside Tree Silhouettes (Midground Parallax with wind sway) */}
      {roadsideTrees.map((treePos, idx) => (
        <group
          key={idx}
          position={treePos}
          ref={(el) => {
            treeRefs.current[idx] = el
          }}
        >
          {/* Trunk */}
          <mesh position={[0, 1.8, 0]} material={treeMat}>
            <cylinderGeometry args={[0.15, 0.25, 3.6, 8]} />
          </mesh>
          {/* Stylized Conical Foliage */}
          <mesh position={[0, 4.5, 0]} material={treeMat}>
            <coneGeometry args={[1.6, 4.5, 8]} />
          </mesh>
          <mesh position={[0, 6.2, 0]} material={treeMat}>
            <coneGeometry args={[1.2, 3.5, 8]} />
          </mesh>
        </group>
      ))}

      {/* 6. Distant Misty Horizon Ridges (Background Parallax) */}
      <group position={[0, -2, 225]} name="HORIZON_RIDGES">
        <mesh position={[-60, 18, 0]} rotation={[0, 0.3, 0]}>
          <coneGeometry args={[55, 35, 6]} />
          <meshBasicMaterial color="#0e131a" />
        </mesh>
        <mesh position={[75, 22, 50]} rotation={[0, -0.4, 0]}>
          <coneGeometry args={[65, 42, 6]} />
          <meshBasicMaterial color="#0c1016" />
        </mesh>
        <mesh position={[-30, 14, 120]} rotation={[0, 0.1, 0]}>
          <coneGeometry args={[45, 28, 6]} />
          <meshBasicMaterial color="#0a0e14" />
        </mesh>
      </group>
    </group>
  )
}
