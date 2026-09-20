import React, { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { getEnvironmentState } from './environmentStore'
import { getRoadState } from '../road/roadStore'

/**
 * ----------------------------------------------------------------------------
 * CINEMATIC RAIN & ROAD SPRAY (Step 12 — Environmental Interaction & Weather)
 * ----------------------------------------------------------------------------
 * GPU-Instanced rain streaks with velocity slanting, wind alignment, and subtle
 * tire spray.
 *
 * Performance & Art-Direction Constraints:
 * - Single InstancedMesh (800 instances desktop, 280 mobile)
 * - Zero per-frame object allocation (reuses pre-allocated matrices & vectors)
 * - Restrained opacity: never obscures the Accord (caps at ~0.38)
 * - Fully hides (visible = false) when rainIntensity < 0.01
 * - Respects prefers-reduced-motion
 */

const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768
const RAIN_COUNT = IS_MOBILE ? 280 : 800
const SPRAY_COUNT = IS_MOBILE ? 24 : 64

// Volume bounds around vehicle
const BOX_X = 30
const BOX_Y = 14
const BOX_Z = 40

interface RainDropData {
  x: number
  y: number
  z: number
  speed: number
  length: number
}

interface SprayParticleData {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  life: number
  maxLife: number
}

export const CinematicRain: React.FC = () => {
  const rainMeshRef = useRef<THREE.InstancedMesh>(null)
  const sprayMeshRef = useRef<THREE.InstancedMesh>(null)

  // Check reduced motion
  const reducedMotionRef = useRef(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)')
      reducedMotionRef.current = media.matches
      const listener = (e: MediaQueryListEvent) => {
        reducedMotionRef.current = e.matches
      }
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    }
  }, [])

  // Initialize rain drop individual positions and speeds
  const rainDrops = useMemo<RainDropData[]>(() => {
    const drops: RainDropData[] = []
    for (let i = 0; i < RAIN_COUNT; i++) {
      drops.push({
        x: (Math.random() - 0.5) * BOX_X,
        y: Math.random() * BOX_Y,
        z: (Math.random() - 0.5) * BOX_Z,
        speed: 16.0 + Math.random() * 8.0, // 16–24 m/s fall rate
        length: 0.35 + Math.random() * 0.25,
      })
    }
    return drops
  }, [])

  // Initialize wheel spray particles
  const sprayParticles = useMemo<SprayParticleData[]>(() => {
    const particles: SprayParticleData[] = []
    for (let i = 0; i < SPRAY_COUNT; i++) {
      particles.push({
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 0.3 + Math.random() * 0.3,
      })
    }
    return particles
  }, [])

  // Pre-allocated transforms for zero-GC useFrame execution
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const sprayDummy = useMemo(() => new THREE.Object3D(), [])
  const euler = useMemo(() => new THREE.Euler(), [])

  // Geometries and materials
  const rainGeo = useMemo(() => new THREE.BoxGeometry(0.012, 0.45, 0.012), [])
  const rainMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#98b4d0'),
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
    []
  )

  const sprayGeo = useMemo(() => new THREE.SphereGeometry(0.12, 6, 6), [])
  const sprayMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#8aa4c0'),
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  )

  useFrame((state, delta) => {
    const env = getEnvironmentState()
    const road = getRoadState()
    const rainMesh = rainMeshRef.current
    const sprayMesh = sprayMeshRef.current

    if (!rainMesh || !sprayMesh) return

    // If reduced motion is requested or rain intensity is zero, hide mesh
    if (reducedMotionRef.current || env.rainIntensity <= 0.005) {
      if (rainMesh.visible) rainMesh.visible = false
      if (sprayMesh.visible) sprayMesh.visible = false
      return
    }

    if (!rainMesh.visible) rainMesh.visible = true

    const dt = Math.min(delta, 0.05)
    const rainInt = env.rainIntensity // Range: 0.0 to ~0.45
    const speedRatio = Math.min(road.speedKmh / 120, 1.0)
    const windInt = env.windIntensity

    // Slant calculation: combined wind + car forward motion
    // Accord drives in negative Z or road streams past
    const slantX = windInt * 0.35
    const slantZ = -speedRatio * 0.55
    euler.set(slantZ, 0, -slantX)
    dummy.quaternion.setFromEuler(euler)

    // Center rain volume around the camera / car focal area
    const camPos = state.camera.position
    const centerX = 0
    const centerY = 3.5
    const centerZ = camPos.z - 6.0

    // Modulate rain opacity with intensity (caps at 0.38 to keep car protagonist)
    rainMat.opacity = THREE.MathUtils.clamp(rainInt * 0.75, 0.05, 0.36)

    // Update Rain Drops
    for (let i = 0; i < RAIN_COUNT; i++) {
      const d = rainDrops[i]

      // Advance downward + lateral drift
      d.y -= d.speed * dt
      d.x += slantX * 8.0 * dt
      d.z += slantZ * 12.0 * dt

      // Wrap around bounding box
      if (d.y < 0) {
        d.y = BOX_Y
        d.x = (Math.random() - 0.5) * BOX_X
        d.z = (Math.random() - 0.5) * BOX_Z
      }
      if (d.x < -BOX_X / 2) d.x = BOX_X / 2
      if (d.x > BOX_X / 2) d.x = -BOX_X / 2
      if (d.z < -BOX_Z / 2) d.z = BOX_Z / 2
      if (d.z > BOX_Z / 2) d.z = -BOX_Z / 2

      dummy.position.set(centerX + d.x, centerY + (d.y - BOX_Y / 2), centerZ + d.z)
      dummy.scale.set(1.0, d.length, 1.0)
      dummy.updateMatrix()
      rainMesh.setMatrixAt(i, dummy.matrix)
    }
    rainMesh.instanceMatrix.needsUpdate = true

    // Subtle Road Wheel Mist (only if road is wet and vehicle is moving)
    const canSpray = env.roadWetness > 0.25 && road.speedKmh > 18.0
    if (canSpray) {
      if (!sprayMesh.visible) sprayMesh.visible = true
      sprayMat.opacity = THREE.MathUtils.clamp(
        env.roadWetness * speedRatio * 0.12,
        0.02,
        0.14
      )

      // 4 wheel emitter bases relative to Accord (approximate wheel positions)
      const wheelOffsets = [
        [-0.82, 0.15, 1.35], // Front Left
        [0.82, 0.15, 1.35], // Front Right
        [-0.82, 0.15, -1.35], // Rear Left
        [0.82, 0.15, -1.35], // Rear Right
      ]

      for (let i = 0; i < SPRAY_COUNT; i++) {
        const p = sprayParticles[i]
        p.life += dt

        if (p.life >= p.maxLife) {
          // Re-spawn behind one of the wheels
          const w = wheelOffsets[i % 4]
          p.x = w[0] + (Math.random() - 0.5) * 0.2
          p.y = w[1] + Math.random() * 0.1
          p.z = w[2] + (Math.random() - 0.2) * 0.3
          p.vx = (Math.random() - 0.5) * 0.4
          p.vy = 0.3 + Math.random() * 0.5
          p.vz = 1.2 + Math.random() * 2.0 // Blown backward behind the car
          p.life = 0
        } else {
          // Move and disperse
          p.x += p.vx * dt
          p.y += p.vy * dt
          p.z += p.vz * dt
        }

        const lifeRatio = p.life / p.maxLife
        const scale = 0.5 + lifeRatio * 1.8

        sprayDummy.position.set(p.x, p.y, p.z)
        sprayDummy.scale.set(scale, scale, scale)
        sprayDummy.updateMatrix()
        sprayMesh.setMatrixAt(i, sprayDummy.matrix)
      }
      sprayMesh.instanceMatrix.needsUpdate = true
    } else {
      if (sprayMesh.visible) sprayMesh.visible = false
    }
  })

  return (
    <group name="CinematicEnvironmentWeather">
      <instancedMesh
        ref={rainMeshRef}
        args={[rainGeo, rainMat, RAIN_COUNT]}
        frustumCulled={false}
        visible={false}
      />
      <instancedMesh
        ref={sprayMeshRef}
        args={[sprayGeo, sprayMat, SPRAY_COUNT]}
        frustumCulled={false}
        visible={false}
      />
    </group>
  )
}
