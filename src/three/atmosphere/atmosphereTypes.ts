import * as THREE from 'three'

/**
 * ----------------------------------------------------------------------------
 * ATMOSPHERE TYPES & UNIFORMS (Step 8 — WebGL / GLSL Cinematic Atmosphere)
 * ----------------------------------------------------------------------------
 */

export interface AtmosphereShaderUniforms {
  uTime: THREE.IUniform<number>
  uProgress: THREE.IUniform<number>
  uPointer: THREE.IUniform<THREE.Vector2>
  uVelocity: THREE.IUniform<number>
  uIntensity: THREE.IUniform<number>
  uResolution: THREE.IUniform<THREE.Vector2>
  uKeyLightPos: THREE.IUniform<THREE.Vector3>
  uKeyLightColor: THREE.IUniform<THREE.Color>
  uRimLightColor: THREE.IUniform<THREE.Color>
  uAmbientColor: THREE.IUniform<THREE.Color>
  uNoiseScale: THREE.IUniform<number>
  uFalloffRadius: THREE.IUniform<number>
}

export interface AtmosphereShaderOptions {
  intensity?: number
  noiseScale?: number
  falloffRadius?: number
}
