/**
 * ----------------------------------------------------------------------------
 * ACCORD SHADER SYSTEM TYPES (Step 18 — Accord Shader System — GLSL)
 * ----------------------------------------------------------------------------
 * TypeScript interfaces for the Accord GLSL shader pipeline: uniforms,
 * material tokens, inspection states, and compile options.
 */

import type * as THREE from 'three'

export interface AccordShaderUniforms {
  uTime: { value: number }
  uProgress: { value: number }
  uInspection: { value: number }
  uReveal: { value: number }
  uIntensity: { value: number }
  uPointer: { value: THREE.Vector2 }
  uResolution: { value: THREE.Vector2 }
  uBaseColor: { value: THREE.Color }
  uEdgeColor: { value: THREE.Color }
  uAccentRed: { value: THREE.Color }
  uRoughness: { value: number }
  uMetalness: { value: number }
}

export interface AccordShaderOptions {
  baseColor?: string | number
  edgeColor?: string | number
  accentRed?: string | number
  roughness?: number
  metalness?: number
  initialIntensity?: number
}

export interface AccordShaderTelemetryState {
  isActive: boolean
  inspection: number
  reveal: number
  intensity: number
  progress: number
  pointer: { x: number; y: number }
  time: number
}
