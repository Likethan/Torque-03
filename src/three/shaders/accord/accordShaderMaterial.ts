/**
 * ----------------------------------------------------------------------------
 * ACCORD SHADER MATERIAL FACTORY (Step 18 — Accord Shader System — GLSL)
 * ----------------------------------------------------------------------------
 * Factory for instantiating the Accord ShaderMaterial with explicit uniform
 * references, graceful standard material fallback, and lifecycle management.
 */

import * as THREE from 'three'
import { ACCORD_VERTEX_SHADER } from './accordVertex'
import { ACCORD_FRAGMENT_SHADER } from './accordFragment'
import { createAccordUniforms } from './accordShaderUniforms'
import type { AccordShaderUniforms, AccordShaderOptions } from './accordShaderTypes'

export interface AccordMaterialInstance {
  material: THREE.Material
  uniforms: AccordShaderUniforms
  isCustomShader: boolean
}

/**
 * Creates an instance of the custom Accord GLSL ShaderMaterial.
 * If WebGL shader compilation fails or is unsupported, gracefully falls back
 * to a standard PBR material without breaking the 3D scene (Requirement 31).
 */
export function createAccordInspectionMaterial(
  options: AccordShaderOptions = {}
): AccordMaterialInstance {
  const uniforms = createAccordUniforms(options)

  try {
    const shaderMaterial = new THREE.ShaderMaterial({
      vertexShader: ACCORD_VERTEX_SHADER,
      fragmentShader: ACCORD_FRAGMENT_SHADER,
      uniforms: uniforms as unknown as { [uniform: string]: THREE.IUniform },
      transparent: false,
      depthWrite: true,
      depthTest: true,
      side: THREE.FrontSide,
    })

    return {
      material: shaderMaterial,
      uniforms,
      isCustomShader: true,
    }
  } catch (err) {
    console.warn('[AccordShader] Shader compilation failed, using standard PBR fallback:', err)
    const fallback = new THREE.MeshStandardMaterial({
      color: new THREE.Color(options.baseColor ?? '#242830'),
      roughness: options.roughness ?? 0.45,
      metalness: options.metalness ?? 0.85,
    })

    return {
      material: fallback,
      uniforms,
      isCustomShader: false,
    }
  }
}
