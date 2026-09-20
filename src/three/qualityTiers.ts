/**
 * RESPONSIVE 3D QUALITY TIERS
 * STEP 20 — PRODUCTION POLISH
 *
 * Provides explicit quality scaling based on device capability:
 * - HIGH (High-end Desktop / Workstation)
 * - MEDIUM (Laptops & Tablets)
 * - LOW (Mobile & Low-Core / Low-Memory Devices)
 */

export type QualityTier = 'HIGH' | 'MEDIUM' | 'LOW'

export interface QualityConfig {
  tier: QualityTier
  dpr: [number, number]
  contactShadows: boolean
  shadowBlur: number
  shadowScale: number
  shadowMapSize: number
  enableDirectionalShadows: boolean
  powerPreference: 'high-performance' | 'default' | 'low-power'
  enableShaderMicroPulse: boolean
  antialiasing: boolean
  targetFPS: number
}

const QUALITY_CONFIGS: Record<QualityTier, QualityConfig> = {
  HIGH: {
    tier: 'HIGH',
    dpr: [1, 2],
    contactShadows: true,
    shadowBlur: 2.2,
    shadowScale: 10,
    shadowMapSize: 2048,
    enableDirectionalShadows: true,
    powerPreference: 'high-performance',
    enableShaderMicroPulse: true,
    antialiasing: true,
    targetFPS: 60,
  },
  MEDIUM: {
    tier: 'MEDIUM',
    dpr: [1, 1.5],
    contactShadows: true,
    shadowBlur: 1.5,
    shadowScale: 8,
    shadowMapSize: 1024,
    enableDirectionalShadows: true,
    powerPreference: 'default',
    enableShaderMicroPulse: false,
    antialiasing: true,
    targetFPS: 60,
  },
  LOW: {
    tier: 'LOW',
    dpr: [1, 1],
    contactShadows: false,
    shadowBlur: 0,
    shadowScale: 0,
    shadowMapSize: 512,
    enableDirectionalShadows: false,
    powerPreference: 'low-power',
    enableShaderMicroPulse: false,
    antialiasing: false,
    targetFPS: 30,
  },
}

let cachedTier: QualityTier | null = null

/**
 * Detects appropriate quality tier based on viewport and hardware concurrency.
 */
export function detectQualityTier(): QualityTier {
  if (typeof window === 'undefined') return 'HIGH'
  if (cachedTier) return cachedTier

  const width = window.innerWidth
  const cores = navigator.hardwareConcurrency || 4

  if (width < 768 || cores <= 2) {
    cachedTier = 'LOW'
  } else if (width < 1200 || cores <= 4) {
    cachedTier = 'MEDIUM'
  } else {
    cachedTier = 'HIGH'
  }

  return cachedTier
}

/**
 * Returns complete configuration for detected quality tier.
 */
export function getQualityConfig(): QualityConfig {
  const tier = detectQualityTier()
  return QUALITY_CONFIGS[tier]
}
