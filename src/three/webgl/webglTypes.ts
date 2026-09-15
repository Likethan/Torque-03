/**
 * ----------------------------------------------------------------------------
 * WEBGL FUNDAMENTALS TYPES (Step 17 — WebGL Fundamentals)
 * ----------------------------------------------------------------------------
 * Type definitions for low-level WebGL context capabilities, GPU buffer
 * telemetry, and custom GLSL shader uniform mappings.
 */

import * as THREE from 'three'

export interface WebGLHardwareCapabilities {
  version: 'WebGL 2.0' | 'WebGL 1.0' | 'Unsupported'
  vendor: string
  unmaskedRenderer: string
  maxTextureSize: number
  maxVertexAttribs: number
  maxVaryingVectors: number
  maxDrawBuffers: number
  isContextLost: boolean
}

export interface ShaderUniformState {
  uTime: { value: number }
  uProgress: { value: number }
  uPointer: { value: THREE.Vector2 }
  uResolution: { value: THREE.Vector2 }
  uBaseColor: { value: THREE.Color }
  uGridColor: { value: THREE.Color }
  uScanIntensity: { value: number }
}

export interface GpuTelemetryMetrics {
  drawCalls: number
  triangles: number
  points: number
  lines: number
  geometries: number
  textures: number
}
