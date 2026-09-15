/**
 * ----------------------------------------------------------------------------
 * ACCORD SHADER UNIFORMS (Step 18 — Accord Shader System — GLSL)
 * ----------------------------------------------------------------------------
 * Centralized uniform initialization and management for the Accord GLSL shader.
 */

import * as THREE from 'three'
import type { AccordShaderUniforms, AccordShaderOptions } from './accordShaderTypes'

/**
 * Creates a pre-allocated dictionary of Three.js shader uniforms matching
 * the 2003 Honda Accord engineering archive palette.
 */
export function createAccordUniforms(options: AccordShaderOptions = {}): AccordShaderUniforms {
  return {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uInspection: { value: 0 },
    uReveal: { value: 0 },
    uIntensity: { value: options.initialIntensity ?? 1.0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uResolution: { value: new THREE.Vector2(1920, 1080) },
    uBaseColor: { value: new THREE.Color(options.baseColor ?? '#242830') },       // Cast gunmetal
    uEdgeColor: { value: new THREE.Color(options.edgeColor ?? '#b5bec8') },       // Satin steel edge
    uAccentRed: { value: new THREE.Color(options.accentRed ?? '#c8102e') },       // Honda Championship Red
    uRoughness: { value: options.roughness ?? 0.45 },
    uMetalness: { value: options.metalness ?? 0.85 },
  }
}
