import * as THREE from 'three'

/**
 * ----------------------------------------------------------------------------
 * THREE.JS RENDERER MODULE (Step 13 — 3D Foundation)
 * ----------------------------------------------------------------------------
 * What is a WebGLRenderer?
 * The renderer is the engine that converts the 3D scene graph, materials, shaders,
 * lights, and camera coordinates into 2D raster pixels drawn onto an HTML5 <canvas>.
 *
 * Core Performance Principles:
 * 1. Pixel Ratio Clamping:
 *    Retina displays often report devicePixelRatio of 3 or 4. Rendering 3D at 3x
 *    results in 9x the pixel fill rate, causing severe GPU throttling on mobile.
 *    We strictly clamp DPR to Math.min(window.devicePixelRatio, 2.0).
 * 2. Tone Mapping:
 *    ACESFilmicToneMapping accurately replicates high-dynamic-range light roll-off
 *    on metallic surfaces (preventing blown-out white specular highlights).
 * 3. Transparent Alpha:
 *    Allows the canvas to sit seamlessly on the dark CSS background.
 * 4. Explicit Resource Disposal:
 *    WebGL contexts and GPU buffers must be explicitly released when unmounting.
 */

export interface RendererContext {
  renderer: THREE.WebGLRenderer
  pixelRatio: number
}

/**
 * Tests whether WebGL is supported by the current client environment.
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    return Boolean(gl && typeof (gl as WebGLRenderingContext).getParameter === 'function')
  } catch {
    return false
  }
}

/**
 * Creates and configures the WebGLRenderer.
 */
export function createStudioRenderer(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): RendererContext {
  const gl =
    canvas.getContext('webgl2') ||
    canvas.getContext('webgl') ||
    canvas.getContext('experimental-webgl')

  if (!gl) {
    throw new Error('WebGL context is not supported or disabled in this browser.')
  }

  // Use verified WebGL context with antialiasing for crisp mechanical edges
  const renderer = new THREE.WebGLRenderer({
    canvas,
    context: gl as WebGLRenderingContext,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    stencil: false,
    depth: true,
  })

  // Tone mapping for photorealistic studio highlights
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15

  // Clamp pixel ratio to max 2.0 to protect mobile GPUs
  const dpr = Math.min(window.devicePixelRatio || 1, 2.0)
  renderer.setPixelRatio(dpr)

  // Configure physical size (false prevents setting style width/height directly if CSS controls it)
  renderer.setSize(width, height, false)

  return {
    renderer,
    pixelRatio: dpr,
  }
}

/**
 * Resizes the renderer canvas buffer to match container dimensions.
 */
export function resizeRenderer(
  renderer: THREE.WebGLRenderer,
  width: number,
  height: number
): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.0)
  renderer.setPixelRatio(dpr)
  renderer.setSize(width, height, false)
}

/**
 * Cleans up WebGL resources, releases shader programs and GPU contexts.
 */
export function disposeRenderer(renderer: THREE.WebGLRenderer): void {
  renderer.dispose()
  // Force WebGL context release if supported
  const gl = renderer.getContext()
  if (gl && 'getExtension' in gl) {
    const loseContext = gl.getExtension('WEBGL_lose_context')
    if (loseContext) {
      loseContext.loseContext()
    }
  }
}
