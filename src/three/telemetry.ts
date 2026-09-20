/**
 * ----------------------------------------------------------------------------
 * THREE.JS TELEMETRY STORE (Step 15 — 3D Choreography)
 * ----------------------------------------------------------------------------
 * High-frequency telemetry store operating outside React's render cycle.
 * Captures real-time camera coordinates, camera lookAt targets, waypoint IDs,
 * local progress, assembly transforms, viewport dimensions, and draw metrics
 * for direct DOM insertion with zero React re-rendering.
 */

import type * as THREE from 'three'

export interface ThreeTelemetryState {
  isActive: boolean
  waypointId: string
  globalProgress: number
  localProgress: number
  cameraPosition: { x: number; y: number; z: number }
  cameraTarget: { x: number; y: number; z: number }
  cameraRotation: { x: number; y: number; z: number }
  objectRotation: { x: number; y: number; z: number }
  componentElevation: number
  pointerOffset: { x: number; y: number }
  meshCount: number
  pixelRatio: number
  viewportWidth: number
  viewportHeight: number
  // Step 16 Mechanical Physics telemetry
  mechanicalProgress: number
  mechanicalVelocity: number
  explodedProgress: number
  primaryAngleDeg: number
  drivenAngleDeg: number
  gearRatio: number
  valveLiftMm: number
  rockerAngleDeg: number
  constraintStatus: string
  // Step 17 WebGL & GPU Pipeline telemetry
  webglVersion: string
  gpuRenderer: string
  drawCalls: number
  trianglesCount: number
  geometriesCount: number
  texturesCount: number
  shaderProgress: number
  // Step 18 Accord GLSL Shader System telemetry
  shaderInspection: number
  shaderReveal: number
  shaderIntensity: number
  shaderCustomStatus: string
  // Step 10 Interior Camera Transition telemetry
  interiorProgress: number
  cameraMode: string
  isInsideCabin: boolean
  // Step 11 Road Driving Sequence telemetry
  roadProgress: number
  roadPhase: string
  roadSpeedKmh: number
  roadDistanceMeters: number
  // Step 12 Environmental Interaction & Weather telemetry
  weatherState: string
  timeOfDay: string
  rainIntensity: number
  roadWetness: number
  windIntensity: number
  fogIntensity: number
}

export interface ThreeDOMBindings {
  statusEl?: HTMLElement | null
  waypointEl?: HTMLElement | null
  globalProgEl?: HTMLElement | null
  localProgEl?: HTMLElement | null
  cameraPosEl?: HTMLElement | null
  cameraTargetEl?: HTMLElement | null
  cameraRotEl?: HTMLElement | null
  objectRotEl?: HTMLElement | null
  componentElevationEl?: HTMLElement | null
  pointerOffsetEl?: HTMLElement | null
  meshCountEl?: HTMLElement | null
  pixelRatioEl?: HTMLElement | null
  viewportSizeEl?: HTMLElement | null
  // Step 16 Mechanical DOM elements
  mechanicalProgressEl?: HTMLElement | null
  mechanicalVelocityEl?: HTMLElement | null
  explodedProgressEl?: HTMLElement | null
  primaryAngleEl?: HTMLElement | null
  drivenAngleEl?: HTMLElement | null
  valveLiftEl?: HTMLElement | null
  rockerAngleEl?: HTMLElement | null
  constraintStatusEl?: HTMLElement | null
  // Step 17 WebGL & GPU DOM elements
  webglVersionEl?: HTMLElement | null
  gpuRendererEl?: HTMLElement | null
  drawCallsEl?: HTMLElement | null
  trianglesCountEl?: HTMLElement | null
  geometriesCountEl?: HTMLElement | null
  texturesCountEl?: HTMLElement | null
  shaderProgressEl?: HTMLElement | null
  // Step 18 Accord Shader DOM elements
  shaderInspectionEl?: HTMLElement | null
  shaderRevealEl?: HTMLElement | null
  shaderIntensityEl?: HTMLElement | null
  shaderCustomStatusEl?: HTMLElement | null
  // Step 10 Interior Camera Transition DOM elements
  interiorProgressEl?: HTMLElement | null
  cameraModeEl?: HTMLElement | null
  cabinStatusEl?: HTMLElement | null
  // Step 11 Road Driving DOM elements
  roadProgressEl?: HTMLElement | null
  roadPhaseEl?: HTMLElement | null
  roadSpeedEl?: HTMLElement | null
  roadDistanceEl?: HTMLElement | null
  // Step 12 Environmental Weather DOM elements
  weatherStateEl?: HTMLElement | null
  timeOfDayEl?: HTMLElement | null
  rainIntensityEl?: HTMLElement | null
  roadWetnessEl?: HTMLElement | null
  windIntensityEl?: HTMLElement | null
  fogIntensityEl?: HTMLElement | null
}

const state: ThreeTelemetryState = {
  isActive: false,
  waypointId: 'ARRIVAL',
  globalProgress: 0,
  localProgress: 0,
  cameraPosition: { x: 0, y: 0, z: 0 },
  cameraTarget: { x: 0, y: 0, z: 0 },
  cameraRotation: { x: 0, y: 0, z: 0 },
  objectRotation: { x: 0, y: 0, z: 0 },
  componentElevation: 0,
  pointerOffset: { x: 0, y: 0 },
  meshCount: 0,
  pixelRatio: 1,
  viewportWidth: 0,
  viewportHeight: 0,
  mechanicalProgress: 0,
  mechanicalVelocity: 0,
  explodedProgress: 0,
  primaryAngleDeg: 0,
  drivenAngleDeg: 0,
  gearRatio: -2.0,
  valveLiftMm: 0,
  rockerAngleDeg: 0,
  constraintStatus: 'OPTIMAL',
  webglVersion: 'WebGL 2.0',
  gpuRenderer: 'Detecting GPU...',
  drawCalls: 0,
  trianglesCount: 0,
  geometriesCount: 0,
  texturesCount: 0,
  shaderProgress: 0,
  shaderInspection: 0,
  shaderReveal: 0,
  shaderIntensity: 1.0,
  shaderCustomStatus: 'ACTIVE (GLSL Custom Material)',
  // Step 10 Interior Camera Transition initial state
  interiorProgress: 0,
  cameraMode: 'EXTERIOR',
  isInsideCabin: false,
  // Step 11 Road Driving Sequence initial state
  roadProgress: 0,
  roadPhase: 'PH-01 // COCKPIT DEPARTURE',
  roadSpeedKmh: 0,
  roadDistanceMeters: 0,
  // Step 12 Environmental Interaction & Weather initial state
  weatherState: 'CLEAR',
  timeOfDay: 'LATE_AFTERNOON',
  rainIntensity: 0,
  roadWetness: 0,
  windIntensity: 0.15,
  fogIntensity: 0.012,
}

const activeBindings: Set<ThreeDOMBindings> = new Set()

/**
 * Registers direct DOM bindings for real-time telemetry display.
 */
export function registerThreeDOMBindings(bindings: ThreeDOMBindings): () => void {
  activeBindings.add(bindings)
  updateDOMBindings()
  return () => {
    activeBindings.delete(bindings)
  }
}

/**
 * Updates telemetry values from the active choreography frame.
 */
export function updateChoreographyTelemetry(
  waypointId: string,
  globalProg: number,
  localProg: number,
  camX: number,
  camY: number,
  camZ: number,
  targetX: number,
  targetY: number,
  targetZ: number,
  rotX: number,
  rotY: number,
  rotZ: number,
  objRotX: number,
  objRotY: number,
  objRotZ: number,
  elevation: number,
  ptrX: number,
  ptrY: number,
  meshCount: number,
  dpr: number,
  width: number,
  height: number
): void {
  state.isActive = true
  state.waypointId = waypointId
  state.globalProgress = globalProg
  state.localProgress = localProg
  state.cameraPosition.x = camX
  state.cameraPosition.y = camY
  state.cameraPosition.z = camZ
  state.cameraTarget.x = targetX
  state.cameraTarget.y = targetY
  state.cameraTarget.z = targetZ
  state.cameraRotation.x = rotX
  state.cameraRotation.y = rotY
  state.cameraRotation.z = rotZ
  state.objectRotation.x = objRotX
  state.objectRotation.y = objRotY
  state.objectRotation.z = objRotZ
  state.componentElevation = elevation
  state.pointerOffset.x = ptrX
  state.pointerOffset.y = ptrY
  state.meshCount = meshCount
  state.pixelRatio = dpr
  state.viewportWidth = width
  state.viewportHeight = height

  updateDOMBindings()
}

/**
 * Backward compatibility helper for Step 13 ThreeScene telemetry.
 */
export function updateThreeTelemetry(
  camX: number,
  camY: number,
  camZ: number,
  rotX: number,
  rotY: number,
  rotZ: number,
  objRotX: number,
  objRotY: number,
  objRotZ: number,
  meshCount: number,
  dpr: number,
  width: number,
  height: number
): void {
  state.isActive = true
  state.cameraPosition.x = camX
  state.cameraPosition.y = camY
  state.cameraPosition.z = camZ
  state.cameraRotation.x = rotX
  state.cameraRotation.y = rotY
  state.cameraRotation.z = rotZ
  state.objectRotation.x = objRotX
  state.objectRotation.y = objRotY
  state.objectRotation.z = objRotZ
  state.meshCount = meshCount
  state.pixelRatio = dpr
  state.viewportWidth = width
  state.viewportHeight = height
  updateDOMBindings()
}

/**
 * Updates high-frequency mechanical physics telemetry from EngineeringAssembly useFrame.
 */
export function updateMechanicalTelemetry(
  mechProgress: number,
  velocity: number,
  explodedProg: number,
  primaryDeg: number,
  drivenDeg: number,
  gearRatio: number,
  liftMm: number,
  rockerDeg: number,
  constraintStatus: string
): void {
  state.mechanicalProgress = mechProgress
  state.mechanicalVelocity = velocity
  state.explodedProgress = explodedProg
  state.primaryAngleDeg = primaryDeg
  state.drivenAngleDeg = drivenDeg
  state.gearRatio = gearRatio
  state.valveLiftMm = liftMm
  state.rockerAngleDeg = rockerDeg
  state.constraintStatus = constraintStatus
  updateDOMBindings()
}

/**
 * Updates GPU and WebGL telemetry metrics directly from the WebGLRenderer.
 */
export function updateGpuTelemetry(
  renderer: THREE.WebGLRenderer,
  version = 'WebGL 2.0',
  gpuVendor = 'Hardware Accelerated'
): void {
  state.webglVersion = version
  state.gpuRenderer = gpuVendor
  state.drawCalls = renderer.info.render.calls
  state.trianglesCount = renderer.info.render.triangles
  state.geometriesCount = renderer.info.memory.geometries
  state.texturesCount = renderer.info.memory.textures
  state.shaderProgress = state.globalProgress
  updateDOMBindings()
}

/**
 * Updates Step 18 Accord GLSL Shader System telemetry metrics.
 */
export function updateAccordShaderTelemetry(
  inspection: number,
  reveal: number,
  intensity: number,
  isCustom = true
): void {
  state.shaderInspection = inspection
  state.shaderReveal = reveal
  state.shaderIntensity = intensity
  state.shaderCustomStatus = isCustom ? 'ACTIVE (GLSL Custom Material)' : 'FALLBACK (Standard PBR)'
  updateDOMBindings()
}

/**
 * Sets 3D inactive upon scene unmount.
 */
export function setThreeInactive(): void {
  state.isActive = false
  updateDOMBindings()
}

/**
 * Updates telemetry values for Step 10 Interior Camera Transition.
 */
export function updateInteriorTelemetry(
  interiorProgress: number,
  cameraMode: string,
  isInside: boolean
): void {
  state.interiorProgress = interiorProgress
  state.cameraMode = cameraMode
  state.isInsideCabin = isInside
  updateDOMBindings()
}

/**
 * Updates telemetry values for Step 11 Road Cinematic Sequence.
 */
export function updateRoadTelemetry(
  roadProgress: number,
  roadPhase: string,
  speedKmh: number,
  distanceMeters: number
): void {
  state.roadProgress = roadProgress
  state.roadPhase = roadPhase
  state.roadSpeedKmh = speedKmh
  state.roadDistanceMeters = distanceMeters
  updateDOMBindings()
}

/**
 * Updates Step 12 Environmental Interaction & Weather telemetry.
 */
export function updateEnvironmentTelemetry(
  weatherState: string,
  timeOfDay: string,
  rainIntensity: number,
  roadWetness: number,
  windIntensity: number,
  fogIntensity: number
): void {
  state.weatherState = weatherState
  state.timeOfDay = timeOfDay
  state.rainIntensity = rainIntensity
  state.roadWetness = roadWetness
  state.windIntensity = windIntensity
  state.fogIntensity = fogIntensity
  updateDOMBindings()
}

/**
 * Returns read-only snapshot of current 3D metrics.
 */
export function getThreeTelemetry(): Readonly<ThreeTelemetryState> {
  return state
}

function updateDOMBindings(): void {
  if (activeBindings.size === 0) return

  const posStr = `(${state.cameraPosition.x.toFixed(2)}, ${state.cameraPosition.y.toFixed(2)}, ${state.cameraPosition.z.toFixed(2)})`
  const targetStr = `(${state.cameraTarget.x.toFixed(2)}, ${state.cameraTarget.y.toFixed(2)}, ${state.cameraTarget.z.toFixed(2)})`
  const rotStr = `(${state.cameraRotation.x.toFixed(2)}, ${state.cameraRotation.y.toFixed(2)}, ${state.cameraRotation.z.toFixed(2)})`
  const objStr = `(${state.objectRotation.x.toFixed(2)}, ${state.objectRotation.y.toFixed(2)}, ${state.objectRotation.z.toFixed(2)})`
  const ptrStr = `(${state.pointerOffset.x > 0 ? '+' : ''}${state.pointerOffset.x.toFixed(2)}, ${state.pointerOffset.y > 0 ? '+' : ''}${state.pointerOffset.y.toFixed(2)})`
  const elevStr = `+${state.componentElevation.toFixed(2)}m`
  const sizeStr = `${state.viewportWidth} × ${state.viewportHeight} px`
  const dprStr = `${state.pixelRatio.toFixed(2)}x`
  const statusStr = state.isActive ? 'ACTIVE (R3F + DREI)' : 'INACTIVE'
  const globalProgStr = `${(state.globalProgress * 100).toFixed(1)}%`
  const localProgStr = `${(state.localProgress * 100).toFixed(1)}%`

  // Mechanical strings
  const mechProgStr = `${(state.mechanicalProgress * 100).toFixed(1)}%`
  const velStr = `${state.mechanicalVelocity >= 0 ? '+' : ''}${state.mechanicalVelocity.toFixed(2)} u/s`
  const explodedStr = `${(state.explodedProgress * 100).toFixed(0)}% (${state.explodedProgress > 0.05 ? (state.explodedProgress >= 0.95 ? 'PEAK INSPECTION' : 'INSPECTION EXPANSION') : 'ASSEMBLED'})`
  const primaryAngleStr = `${state.primaryAngleDeg.toFixed(1)}° (${(state.primaryAngleDeg / 360).toFixed(2)} rev)`
  const drivenAngleStr = `${state.drivenAngleDeg.toFixed(1)}° [Ratio ${state.gearRatio.toFixed(1)}]`
  const valveLiftStr = `${state.valveLiftMm.toFixed(2)} mm (Max 11.20 mm)`
  const rockerAngleStr = `${state.rockerAngleDeg.toFixed(1)}° [Hinge Limits -2.3° / +12.6°]`

  // GPU & WebGL strings
  const shaderProgStr = `${(state.shaderProgress * 100).toFixed(1)}%`

  activeBindings.forEach((b) => {
    if (b.statusEl) b.statusEl.textContent = statusStr
    if (b.waypointEl) b.waypointEl.textContent = state.waypointId
    if (b.globalProgEl) b.globalProgEl.textContent = globalProgStr
    if (b.localProgEl) b.localProgEl.textContent = localProgStr
    if (b.cameraPosEl) b.cameraPosEl.textContent = posStr
    if (b.cameraTargetEl) b.cameraTargetEl.textContent = targetStr
    if (b.cameraRotEl) b.cameraRotEl.textContent = rotStr
    if (b.objectRotEl) b.objectRotEl.textContent = objStr
    if (b.componentElevationEl) b.componentElevationEl.textContent = elevStr
    if (b.pointerOffsetEl) b.pointerOffsetEl.textContent = ptrStr
    if (b.meshCountEl) b.meshCountEl.textContent = `${state.meshCount}`
    if (b.pixelRatioEl) b.pixelRatioEl.textContent = dprStr
    if (b.viewportSizeEl) b.viewportSizeEl.textContent = sizeStr

    // Step 16 Mechanical Telemetry elements
    if (b.mechanicalProgressEl) b.mechanicalProgressEl.textContent = mechProgStr
    if (b.mechanicalVelocityEl) b.mechanicalVelocityEl.textContent = velStr
    if (b.explodedProgressEl) b.explodedProgressEl.textContent = explodedStr
    if (b.primaryAngleEl) b.primaryAngleEl.textContent = primaryAngleStr
    if (b.drivenAngleEl) b.drivenAngleEl.textContent = drivenAngleStr
    if (b.valveLiftEl) b.valveLiftEl.textContent = valveLiftStr
    if (b.rockerAngleEl) b.rockerAngleEl.textContent = rockerAngleStr
    if (b.constraintStatusEl) {
      b.constraintStatusEl.textContent = state.constraintStatus
      b.constraintStatusEl.style.color = state.constraintStatus === 'OPTIMAL' ? 'var(--color-technical-cyan, #00d4ff)' : 'var(--color-signal-amber, #ffaa00)'
    }

    // Step 17 WebGL & GPU Telemetry elements
    if (b.webglVersionEl) b.webglVersionEl.textContent = state.webglVersion
    if (b.gpuRendererEl) b.gpuRendererEl.textContent = state.gpuRenderer
    if (b.drawCallsEl) b.drawCallsEl.textContent = `${state.drawCalls}`
    if (b.trianglesCountEl) b.trianglesCountEl.textContent = `${state.trianglesCount.toLocaleString()}`
    if (b.geometriesCountEl) b.geometriesCountEl.textContent = `${state.geometriesCount}`
    if (b.texturesCountEl) b.texturesCountEl.textContent = `${state.texturesCount}`
    if (b.shaderProgressEl) b.shaderProgressEl.textContent = shaderProgStr

    // Step 18 Accord Shader Telemetry elements
    if (b.shaderInspectionEl) b.shaderInspectionEl.textContent = `${(state.shaderInspection * 100).toFixed(1)}%`
    if (b.shaderRevealEl) b.shaderRevealEl.textContent = `${(state.shaderReveal * 100).toFixed(1)}%`
    if (b.shaderIntensityEl) b.shaderIntensityEl.textContent = `${state.shaderIntensity.toFixed(2)}x`
    if (b.shaderCustomStatusEl) b.shaderCustomStatusEl.textContent = state.shaderCustomStatus

    // Step 10 Interior Telemetry elements
    if (b.interiorProgressEl) b.interiorProgressEl.textContent = `${(state.interiorProgress * 100).toFixed(1)}%`
    if (b.cameraModeEl) b.cameraModeEl.textContent = state.cameraMode
    if (b.cabinStatusEl) {
      b.cabinStatusEl.textContent = state.isInsideCabin ? 'CABIN ENVIRONMENT' : 'EXTERIOR'
      b.cabinStatusEl.style.color = state.isInsideCabin
        ? 'var(--color-technical-cyan, #00d4ff)'
        : 'var(--color-text-secondary, #9da4b0)'
    }

    // Step 11 Road Telemetry elements
    if (b.roadProgressEl) b.roadProgressEl.textContent = `${(state.roadProgress * 100).toFixed(1)}%`
    if (b.roadPhaseEl) b.roadPhaseEl.textContent = state.roadPhase
    if (b.roadSpeedEl) b.roadSpeedEl.textContent = `${Math.round(state.roadSpeedKmh)} km/h`
    if (b.roadDistanceEl) b.roadDistanceEl.textContent = `${Math.round(state.roadDistanceMeters)} m`

    // Step 12 Environmental Weather Telemetry elements
    if (b.weatherStateEl) b.weatherStateEl.textContent = state.weatherState
    if (b.timeOfDayEl) b.timeOfDayEl.textContent = state.timeOfDay
    if (b.rainIntensityEl) b.rainIntensityEl.textContent = `${(state.rainIntensity * 100).toFixed(0)}%`
    if (b.roadWetnessEl) b.roadWetnessEl.textContent = `${(state.roadWetness * 100).toFixed(0)}%`
    if (b.windIntensityEl) b.windIntensityEl.textContent = `${(state.windIntensity * 100).toFixed(0)}%`
    if (b.fogIntensityEl) b.fogIntensityEl.textContent = `${(state.fogIntensity * 1000).toFixed(1)}`
  })
}
