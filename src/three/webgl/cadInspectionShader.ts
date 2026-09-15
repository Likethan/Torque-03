/**
 * ----------------------------------------------------------------------------
 * CAD INSPECTION DATUM SHADER (Step 17 — WebGL Fundamentals)
 * ----------------------------------------------------------------------------
 * A custom GLSL ShaderMaterial program demonstrating the fundamental WebGL
 * graphics pipeline:
 *
 * 1. Vertex Processing:
 *    - Fetches attribute buffers (position, normal, uv)
 *    - Multiplies position by Model-View and Projection matrices (MVP)
 *    - Passes interpolated varyings (vUv, vWorldPosition) to rasterizer
 *
 * 2. Fragment Processing:
 *    - Receives rasterized, barycentrically-interpolated varyings
 *    - Evaluates screen-space partial derivatives fwidth() for anti-aliased CAD grid ticks
 *    - Samples uProgress to sweep a technical optical inspection wave across the datum plane
 *    - Incorporates uPointer for subtle parallax focus
 *    - Outputs final 32-bit RGBA pixel color to the framebuffer
 */

import * as THREE from 'three'
import type { ShaderUniformState } from './webglTypes'

/**
 * GLSL Vertex Shader Source
 */
export const CAD_INSPECTION_VERTEX_SHADER = /* glsl */ `
  // Varyings passed across the rasterizer to the fragment shader
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  uniform float uTime;
  uniform float uProgress;

  void main() {
    vUv = uv;

    // Transform local vertex coordinate into world space
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;

    // Standard Model-View-Projection (MVP) pipeline:
    // Local Object Space -> World Space -> View (Camera) Space -> Homogeneous Clip Space
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * GLSL Fragment Shader Source
 */
export const CAD_INSPECTION_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  varying vec3 vWorldPosition;

  // Uniforms supplied from the CPU / R3F frame loop
  uniform float uTime;
  uniform float uProgress;
  uniform vec2 uPointer;
  uniform vec2 uResolution;
  uniform vec3 uBaseColor;
  uniform vec3 uGridColor;
  uniform float uScanIntensity;

  /**
   * Anti-aliased procedural grid using screen-space partial derivatives fwidth().
   * Prevents moire aliasing artifacts as the grid recedes into the distance.
   */
  float computeGrid(vec2 uv, float gridDensity, float lineWidth) {
    vec2 coord = uv * gridDensity;
    vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
    float line = min(grid.x, grid.y);
    return 1.0 - min(line / lineWidth, 1.0);
  }

  void main() {
    // 1. Dual-frequency CAD datum coordinate lines (major and minor axes)
    float minorGrid = computeGrid(vUv, 64.0, 1.0) * 0.22;
    float majorGrid = computeGrid(vUv, 16.0, 1.5) * 0.55;
    float combinedGrid = max(minorGrid, majorGrid);

    // 2. Radial distance falloff from coordinate center (0.5, 0.5)
    vec2 centeredUv = vUv - vec2(0.5);
    float dist = length(centeredUv);
    float radialVignette = smoothstep(0.48, 0.12, dist);

    // 3. Pointer parallax focus offset (subtle mouse cursor influence)
    vec2 pointerTarget = vec2(0.5) + (uPointer * 0.08);
    float pointerProximity = 1.0 - smoothstep(0.0, 0.45, distance(vUv, pointerTarget));
    float pointerGlow = pointerProximity * 0.18;

    // 4. Scroll-driven Inspection Scanning Pulse (uProgress)
    // A planar optical scanning band sweeps across the Z-axis (-Z to +Z in UV space)
    float scanTargetV = uProgress;
    float scanDist = abs(vUv.y - scanTargetV);
    float scanWave = smoothstep(0.06, 0.0, scanDist) * uScanIntensity;

    // 5. Composite Final Fragment Color
    vec3 color = uBaseColor;

    // Add coordinate grid illumination
    color = mix(color, uGridColor, combinedGrid * radialVignette);

    // Add subtle pointer spotlight
    color += uGridColor * pointerGlow * radialVignette;

    // Add optical inspection scanning beam (technical white-cyan highlight)
    vec3 scanColor = mix(uGridColor, vec3(0.92, 0.95, 1.0), 0.6);
    color += scanColor * scanWave * radialVignette;

    // Alpha transparency blending: edges fade cleanly into the dark CSS background
    float alpha = radialVignette * (0.35 + (combinedGrid * 0.5) + (scanWave * 0.4));

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
  }
`

/**
 * Factory function creating a customized Three.js ShaderMaterial.
 */
export function createCadInspectionMaterial(): {
  material: THREE.ShaderMaterial
  uniforms: ShaderUniformState
} {
  const uniforms: ShaderUniformState = {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uResolution: { value: new THREE.Vector2(1920, 1080) },
    uBaseColor: { value: new THREE.Color('#0b0d10') },
    uGridColor: { value: new THREE.Color('#38424d') },
    uScanIntensity: { value: 0.85 },
  }

  const material = new THREE.ShaderMaterial({
    vertexShader: CAD_INSPECTION_VERTEX_SHADER,
    fragmentShader: CAD_INSPECTION_FRAGMENT_SHADER,
    uniforms: uniforms as unknown as { [uniform: string]: THREE.IUniform },
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
  })

  return { material, uniforms }
}
