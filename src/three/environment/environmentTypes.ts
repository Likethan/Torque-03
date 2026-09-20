/**
 * ----------------------------------------------------------------------------
 * ENVIRONMENT & WEATHER TYPES (Step 12 — Environmental Interaction & Weather)
 * ----------------------------------------------------------------------------
 * Type definitions for the 5 authored cinematic weather states, time-of-day
 * progressions, and environmental parameters.
 */

export type WeatherStateId =
  | 'CLEAR'
  | 'OVERCAST'
  | 'MIST'
  | 'RAIN'
  | 'BLUE_HOUR'

export type TimeOfDayId =
  | 'LATE_AFTERNOON'
  | 'GOLDEN_HOUR'
  | 'DUSK'
  | 'BLUE_HOUR'

export interface WeatherPresetConfig {
  id: WeatherStateId
  name: string
  timeOfDay: TimeOfDayId
  rainIntensity: number
  roadWetness: number
  fogIntensity: number
  fogColor: string
  windIntensity: number
  sunElevationDeg: number
  keyColor: string
  keyIntensity: number
  ambientColor: string
  skyHorizonColor: string
  skyZenithColor: string
  description: string
}

export interface EnvironmentState {
  weatherState: WeatherStateId
  timeOfDay: TimeOfDayId
  rainIntensity: number
  roadWetness: number
  fogIntensity: number
  fogColor: string
  windIntensity: number
  sunElevationDeg: number
  keyColor: string
  keyIntensity: number
  ambientColor: string
  skyHorizonColor: string
  skyZenithColor: string
}
