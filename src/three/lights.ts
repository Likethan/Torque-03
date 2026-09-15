import * as THREE from 'three'

/**
 * ----------------------------------------------------------------------------
 * THREE.JS LIGHTING MODULE (Step 13 — 3D Foundation)
 * ----------------------------------------------------------------------------
 * How Lighting Interacts with Materials:
 * Physically based materials like MeshStandardMaterial require light rays to
 * calculate surface radiance via the Bidirectional Reflectance Distribution
 * Function (BRDF). Without lights, the scene would render completely pitch black.
 *
 * Studio Lighting Architecture:
 * 1. AmbientLight:
 *    Provides uniform, omnidirectional baseline illumination. Prevents underside
 *    and occluded polygons from turning pure black.
 * 2. DirectionalLight (Key Light):
 *    Emits parallel light rays from an elevated front-quarter studio position.
 *    Creates crisp specular highlights across metallic bevels and reveals the
 *    machined surface finish.
 * 3. DirectionalLight (Cool Rim Light):
 *    Positioned behind and to the opposing flank. Glances along silhouette edges,
 *    separating the engineering assembly from the dark background.
 * 4. PointLight (Warm Fill):
 *    Subtle localized point source positioned below the assembly to bring out
 *    the underside details of the subframe carrier.
 */

export interface StudioLights {
  ambientLight: THREE.AmbientLight
  keyLight: THREE.DirectionalLight
  rimLight: THREE.DirectionalLight
  fillLight: THREE.PointLight
}

/**
 * Configures the automotive studio lighting rig and adds lights to the scene.
 */
export function setupStudioLighting(scene: THREE.Scene): StudioLights {
  // 1. Ambient Base Fill: Muted dark slate tone (#222831) at restrained intensity
  const ambientLight = new THREE.AmbientLight(0x222831, 0.75)
  scene.add(ambientLight)

  // 2. Key Light: High-angle studio softbox tone (#f5f6f8)
  const keyLight = new THREE.DirectionalLight(0xf5f6f8, 1.9)
  keyLight.position.set(4.5, 6.0, 3.5)
  scene.add(keyLight)

  // 3. Rim / Accent Light: Cool titanium white (#8ea0b5) for sharp edge definition
  const rimLight = new THREE.DirectionalLight(0x8ea0b5, 1.1)
  rimLight.position.set(-4.5, 3.5, -3.0)
  scene.add(rimLight)

  // 4. Underside Warm Fill: Very subtle warm tungsten bounce (#e6dfd8)
  const fillLight = new THREE.PointLight(0xe6dfd8, 0.45, 12, 1.5)
  fillLight.position.set(0, -1.8, 2.5)
  scene.add(fillLight)

  return {
    ambientLight,
    keyLight,
    rimLight,
    fillLight,
  }
}
