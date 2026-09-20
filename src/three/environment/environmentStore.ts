import { useSyncExternalStore } from 'react'
import type { WeatherStateId, EnvironmentState } from './environmentTypes'
import {
  WEATHER_PRESETS,
  createDefaultEnvironmentState,
  sampleEnvironmentState,
} from './weatherPresets'

/**
 * ----------------------------------------------------------------------------
 * ENVIRONMENT STORE (Step 12 — Environmental Interaction & Weather)
 * ----------------------------------------------------------------------------
 * High-performance, zero-allocation centralized environment state.
 *
 * Designed according to User Requirements:
 * - High-frequency updates: Mutable container read in useFrame (no React overhead).
 * - React subscriptions: useSyncExternalStore only notifies when discrete state
 *   (weatherState, timeOfDay) or quantized progress changes to avoid 60fps rerenders.
 * - Dev debug override: Allows locking/testing specific presets and parameters.
 */

// Mutable single-instance container accessed at 60/120fps by useFrame
const activeEnvironmentState: EnvironmentState = createDefaultEnvironmentState()

// Snapshot container for React components that need re-rendering on discrete updates
let reactSnapshot: EnvironmentState = { ...activeEnvironmentState }

// Debug override state (null = driven by road progression)
let debugPresetOverride: WeatherStateId | null = null

const listeners = new Set<() => void>()

function emitChange(): void {
  reactSnapshot = { ...activeEnvironmentState }
  for (const listener of listeners) {
    listener()
  }
}

/**
 * Direct access to the live mutable environment state.
 * Use inside useFrame loops for zero-garbage-collection reading.
 */
export function getEnvironmentState(): Readonly<EnvironmentState> {
  return activeEnvironmentState
}

/**
 * Updates the live environment state based on road progress [0.0, 1.0].
 * Called during road sequence scrubbing or per-frame progression.
 */
export function updateEnvironmentFromProgress(roadProgress: number): void {
  if (debugPresetOverride) {
    // If locked to a debug preset, preserve the manual preset
    return
  }

  const prevWeather = activeEnvironmentState.weatherState
  const prevTimeOfDay = activeEnvironmentState.timeOfDay

  sampleEnvironmentState(roadProgress, activeEnvironmentState)

  // Notify UI subscribers only if the discrete weather state or time-of-day changed
  if (
    prevWeather !== activeEnvironmentState.weatherState ||
    prevTimeOfDay !== activeEnvironmentState.timeOfDay
  ) {
    emitChange()
  }
}

/**
 * Sets a debug preset override (or null to return to dynamic road progression).
 */
export function setWeatherDebugOverride(presetId: WeatherStateId | null): void {
  debugPresetOverride = presetId

  if (presetId) {
    const preset = WEATHER_PRESETS[presetId]
    if (preset) {
      activeEnvironmentState.weatherState = preset.id
      activeEnvironmentState.timeOfDay = preset.timeOfDay
      activeEnvironmentState.rainIntensity = preset.rainIntensity
      activeEnvironmentState.roadWetness = preset.roadWetness
      activeEnvironmentState.fogIntensity = preset.fogIntensity
      activeEnvironmentState.fogColor = preset.fogColor
      activeEnvironmentState.windIntensity = preset.windIntensity
      activeEnvironmentState.sunElevationDeg = preset.sunElevationDeg
      activeEnvironmentState.keyColor = preset.keyColor
      activeEnvironmentState.keyIntensity = preset.keyIntensity
      activeEnvironmentState.ambientColor = preset.ambientColor
      activeEnvironmentState.skyHorizonColor = preset.skyHorizonColor
      activeEnvironmentState.skyZenithColor = preset.skyZenithColor
    }
  }
  emitChange()
}

/**
 * Updates specific environmental properties manually (used by dev HUD sliders).
 */
export function setWeatherDebugProperty(prop: Partial<EnvironmentState>): void {
  Object.assign(activeEnvironmentState, prop)
  emitChange()
}

/**
 * Returns whether a debug override is currently active.
 */
export function isWeatherDebugActive(): boolean {
  return debugPresetOverride !== null
}

/**
 * React hook to subscribe to discrete weather state changes (for UI badges, etc.).
 */
export function useEnvironmentState(): EnvironmentState {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback)
      return () => listeners.delete(callback)
    },
    () => reactSnapshot
  )
}
