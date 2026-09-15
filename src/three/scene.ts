import * as THREE from 'three'

/**
 * ----------------------------------------------------------------------------
 * THREE.JS SCENE MODULE (Step 13 — 3D Foundation)
 * ----------------------------------------------------------------------------
 * What is a Scene?
 * The Scene is the fundamental graph container in Three.js. It holds all 3D
 * entities: meshes, groups, lights, cameras, and coordinate helpers.
 *
 * It is NOT the renderer (which draws pixels) and NOT the camera (which defines
 * the vantage point). It is the spatial universe in which coordinates exist.
 */

export interface SceneContext {
  scene: THREE.Scene
  gridHelper: THREE.GridHelper
}

/**
 * Creates and configures the Three.js scene with automotive studio atmosphere.
 */
export function createStudioScene(): SceneContext {
  const scene = new THREE.Scene()

  // Background is left transparent (null) so canvas seamlessly overlays
  // the dark charcoal/black editorial background (#0b0d0f to #12151a).
  scene.background = null

  // Subtle exponential studio depth fog:
  // Blends distant geometry into the dark background without harsh clip lines.
  scene.fog = new THREE.FogExp2(0x0e1013, 0.04)

  // Technical CAD coordinate grid:
  // Provides visual grounding and spatial depth scale for automotive inspection.
  // Size: 16 units, Divisions: 32.
  // Center line: muted steel (#2a313a), Grid lines: dark charcoal (#161a20).
  const gridHelper = new THREE.GridHelper(16, 32, 0x2a313a, 0x161a20)
  gridHelper.position.y = -1.2
  gridHelper.material.opacity = 0.4
  gridHelper.material.transparent = true
  scene.add(gridHelper)

  return { scene, gridHelper }
}
