/**
 * ----------------------------------------------------------------------------
 * WEBGL CAPABILITIES & CONTEXT INSPECTOR (Step 17 — WebGL Fundamentals)
 * ----------------------------------------------------------------------------
 * Low-level introspection of the browser's WebGL context, querying hardware
 * limits, unmasked GPU chipset info, and handling context life cycle.
 */

import type { WebGLHardwareCapabilities } from './webglTypes'

let cachedCapabilities: WebGLHardwareCapabilities | null = null

/**
 * Inspects the WebGL context directly to extract hardware capabilities.
 */
export function getWebGLCapabilities(gl?: WebGLRenderingContext | WebGL2RenderingContext | null): WebGLHardwareCapabilities {
  if (cachedCapabilities && !gl) {
    return cachedCapabilities
  }

  if (typeof window === 'undefined') {
    return {
      version: 'Unsupported',
      vendor: 'Unknown',
      unmaskedRenderer: 'Headless / SSR',
      maxTextureSize: 0,
      maxVertexAttribs: 0,
      maxVaryingVectors: 0,
      maxDrawBuffers: 0,
      isContextLost: false,
    }
  }

  let activeGl = gl
  let createdCanvas: HTMLCanvasElement | null = null

  if (!activeGl) {
    try {
      createdCanvas = document.createElement('canvas')
      activeGl = (createdCanvas.getContext('webgl2') ||
        createdCanvas.getContext('webgl') ||
        createdCanvas.getContext('experimental-webgl')) as
        | WebGLRenderingContext
        | WebGL2RenderingContext
        | null
    } catch {
      activeGl = null
    }
  }

  if (!activeGl) {
    return {
      version: 'Unsupported',
      vendor: 'None',
      unmaskedRenderer: 'Hardware Acceleration Disabled',
      maxTextureSize: 0,
      maxVertexAttribs: 0,
      maxVaryingVectors: 0,
      maxDrawBuffers: 0,
      isContextLost: true,
    }
  }

  // Determine WebGL version
  const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && activeGl instanceof WebGL2RenderingContext
  const version: 'WebGL 2.0' | 'WebGL 1.0' = isWebGL2 ? 'WebGL 2.0' : 'WebGL 1.0'

  // Query unmasked GPU renderer info via WebGL extension
  let vendor = activeGl.getParameter(activeGl.VENDOR) || 'Unknown'
  let unmaskedRenderer = activeGl.getParameter(activeGl.RENDERER) || 'Generic GPU'

  const debugInfo = activeGl.getExtension('WEBGL_debug_renderer_info')
  if (debugInfo) {
    const unmaskedV = activeGl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
    const unmaskedR = activeGl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    if (unmaskedV) vendor = unmaskedV
    if (unmaskedR) unmaskedRenderer = unmaskedR
  }

  // Hardware limits
  const maxTextureSize = (activeGl.getParameter(activeGl.MAX_TEXTURE_SIZE) as number) || 4096
  const maxVertexAttribs = (activeGl.getParameter(activeGl.MAX_VERTEX_ATTRIBS) as number) || 16
  const maxVaryingVectors = (activeGl.getParameter(activeGl.MAX_VARYING_VECTORS) as number) || 8
  const maxDrawBuffers = isWebGL2
    ? ((activeGl as WebGL2RenderingContext).getParameter((activeGl as WebGL2RenderingContext).MAX_DRAW_BUFFERS) as number) || 1
    : 1

  cachedCapabilities = {
    version,
    vendor,
    unmaskedRenderer,
    maxTextureSize,
    maxVertexAttribs,
    maxVaryingVectors,
    maxDrawBuffers,
    isContextLost: activeGl.isContextLost ? activeGl.isContextLost() : false,
  }

  return cachedCapabilities
}

/**
 * Registers WebGL context loss and recovery event listeners on a canvas element.
 */
export function registerContextLossHandlers(
  canvas: HTMLCanvasElement,
  onLost?: (event: Event) => void,
  onRestored?: (event: Event) => void
): () => void {
  const handleLost = (e: Event) => {
    e.preventDefault()
    if (cachedCapabilities) cachedCapabilities.isContextLost = true
    onLost?.(e)
  }

  const handleRestored = (e: Event) => {
    if (cachedCapabilities) cachedCapabilities.isContextLost = false
    onRestored?.(e)
  }

  canvas.addEventListener('webglcontextlost', handleLost, false)
  canvas.addEventListener('webglcontextrestored', handleRestored, false)

  return () => {
    canvas.removeEventListener('webglcontextlost', handleLost)
    canvas.removeEventListener('webglcontextrestored', handleRestored)
  }
}
