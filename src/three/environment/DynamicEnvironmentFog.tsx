import React, { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { getEnvironmentState } from './environmentStore'
import { getRoadState } from '../road/roadStore'

/**
 * ----------------------------------------------------------------------------
 * DYNAMIC ENVIRONMENT FOG (Step 12 — Environmental Interaction & Weather)
 * ----------------------------------------------------------------------------
 * Dynamically modulates `scene.fog` based on continuous road environment state.
 *
 * Requirements:
 * - Clear: low atmospheric density (0.012)
 * - Mist: elevated depth fog (0.032)
 * - Rain: moody oceanic tone (0.026)
 * - Blue hour: deep twilight veil (0.022)
 * - Restores default studio exponential fog (#0e1013, 0.04) when outside road stage
 * - Zero memory allocations per frame
 */
export const DynamicEnvironmentFog: React.FC = () => {
  const scene = useThree((state) => state.scene)

  // Pre-allocated colors
  const targetFogColor = useMemo(() => new THREE.Color(), [])
  const studioFogColor = useMemo(() => new THREE.Color('#0e1013'), [])

  useFrame((_, delta) => {
    const fog = scene.fog as THREE.FogExp2 | null
    if (!fog) return

    const road = getRoadState()
    const env = getEnvironmentState()
    const lerpFactor = Math.min(delta * 4.0, 1.0)

    if (road.roadProgress > 0.01) {
      // In Road / Driving Sequence: modulate fog with continuous weather state
      targetFogColor.set(env.fogColor)
      fog.color.lerp(targetFogColor, lerpFactor)
      fog.density = THREE.MathUtils.lerp(fog.density, env.fogIntensity, lerpFactor)
    } else {
      // Return to Studio Exponential Fog
      fog.color.lerp(studioFogColor, lerpFactor)
      fog.density = THREE.MathUtils.lerp(fog.density, 0.04, lerpFactor)
    }
  })

  return null
}
