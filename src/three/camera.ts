import * as THREE from 'three'

/**
 * ----------------------------------------------------------------------------
 * THREE.JS CAMERA MODULE (Step 13 — 3D Foundation)
 * ----------------------------------------------------------------------------
 * What is a PerspectiveCamera?
 * A perspective camera mimics human and photographic vision, where distant
 * objects appear smaller than near objects (perspective foreshortening).
 *
 * Core Parameters:
 * - fov (Field of View): Vertical viewing angle in degrees.
 *   We use 38° — a restrained, medium-telephoto aesthetic standard in automotive
 *   studio photography. It flattens unnecessary fisheye distortion and emphasizes
 *   precise engineering proportions.
 * - aspect (Aspect Ratio): Width / Height of the viewport canvas. Must be
 *   updated on resize to prevent optical stretching.
 * - near: Distance to the near clipping plane (0.1 units). Objects closer
 *   than this are not rendered.
 * - far: Distance to the far clipping plane (100.0 units). Objects beyond
 *   this are clipped.
 * - position: Spatial coordinates (X, Y, Z) of the camera eye.
 * - lookAt: Spatial target point the camera points its optical axis toward.
 */

export interface CameraConfig {
  fov?: number
  near?: number
  far?: number
  initialPosition?: THREE.Vector3
  target?: THREE.Vector3
}

export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  fov: 38,
  near: 0.1,
  far: 100,
  initialPosition: new THREE.Vector3(3.2, 1.8, 4.2),
  target: new THREE.Vector3(0, 0, 0),
}

/**
 * Creates and initializes the primary perspective camera.
 */
export function createStudioCamera(
  aspect: number,
  config: CameraConfig = DEFAULT_CAMERA_CONFIG
): THREE.PerspectiveCamera {
  const fov = config.fov ?? DEFAULT_CAMERA_CONFIG.fov!
  const near = config.near ?? DEFAULT_CAMERA_CONFIG.near!
  const far = config.far ?? DEFAULT_CAMERA_CONFIG.far!

  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)

  const pos = config.initialPosition ?? DEFAULT_CAMERA_CONFIG.initialPosition!
  camera.position.copy(pos)

  const target = config.target ?? DEFAULT_CAMERA_CONFIG.target!
  camera.lookAt(target)

  return camera
}

/**
 * Updates camera projection when viewport dimensions change.
 * Must be called whenever canvas aspect ratio changes.
 */
export function updateCameraAspect(
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number
): void {
  if (height <= 0) return
  camera.aspect = width / height
  // updateProjectionMatrix must be called after changing fov, aspect, near, or far
  // to recalculate the 4x4 mathematical projection matrix on the GPU!
  camera.updateProjectionMatrix()
}
