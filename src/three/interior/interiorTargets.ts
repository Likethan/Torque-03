/**
 * ----------------------------------------------------------------------------
 * INTERIOR LOOK-AT TARGETS (Step 10 — Interior Camera Transition)
 * ----------------------------------------------------------------------------
 * Pre-defined spatial target positions for controlled interior camera
 * composition. Each target represents a cinematic focal point within the
 * 2003 Honda Accord cabin.
 *
 * Coordinate System:
 * - Origin is at vehicle center (matching engineering assembly origin)
 * - +X: passenger side, -X: driver side
 * - +Y: up, -Y: down
 * - +Z: forward (windshield direction), -Z: rear
 *
 * All positions are relative to the cabin group origin, which is offset
 * from the engineering assembly to represent the vehicle's interior space.
 */

export interface InteriorTarget {
  id: string
  label: string
  system: string
  description: string
  /** Camera position when focused on this target [x, y, z] */
  cameraPosition: [number, number, number]
  /** LookAt target point [x, y, z] */
  lookAt: [number, number, number]
  /** Recommended FOV override (or null to keep default) */
  fovOverride: number | null
}

/**
 * Cabin origin offset from the engineering assembly world origin.
 * The engineering assembly sits at world (0, 0, 0) — the cabin is positioned
 * where the vehicle passenger compartment would exist relative to the powertrain.
 */
export const CABIN_ORIGIN_OFFSET: [number, number, number] = [0, 0, 3.5]

export const INTERIOR_TARGETS: readonly InteriorTarget[] = [
  {
    id: 'TARGET_DRIVER',
    label: 'DRIVER POSITION',
    system: 'ERGONOMIC COMMAND CENTER',
    description:
      'The driver\'s seated perspective at H-point eye height, centered on the forward driving view through the windshield.',
    cameraPosition: [-0.35, 1.12, 4.8],
    lookAt: [0.0, 0.95, 7.5],
    fovOverride: 42,
  },
  {
    id: 'TARGET_STEERING',
    label: 'STEERING INTERFACE',
    system: 'DRIVER CONTROL MODULE',
    description:
      'Leather-trimmed 3-spoke steering wheel with integrated audio controls and cruise control switches.',
    cameraPosition: [-0.28, 1.08, 4.6],
    lookAt: [-0.12, 0.92, 5.4],
    fovOverride: 40,
  },
  {
    id: 'TARGET_CLUSTER',
    label: 'INSTRUMENT CLUSTER',
    system: 'DRIVER TELEMETRY DISPLAY',
    description:
      'Backlit electro-luminescent instrument panel with 160 mph speedometer, 7,000 RPM tachometer, and multi-function information display.',
    cameraPosition: [-0.22, 1.10, 4.5],
    lookAt: [0.0, 0.98, 5.8],
    fovOverride: 38,
  },
  {
    id: 'TARGET_CONSOLE',
    label: 'CENTER CONSOLE',
    system: 'INTEGRATED COMMAND INTERFACE',
    description:
      'Tiered console architecture housing climate controls, 6-disc CD changer, and leather-wrapped shift knob.',
    cameraPosition: [0.1, 1.05, 4.6],
    lookAt: [0.18, 0.72, 5.3],
    fovOverride: 42,
  },
  {
    id: 'TARGET_DASHBOARD',
    label: 'DASHBOARD ARCHITECTURE',
    system: 'HORIZONTAL DESIGN DATUM',
    description:
      'Flowing horizontal dashboard emphasizing width and structural calm, with integrated passenger airbag and defroster vents.',
    cameraPosition: [-0.15, 1.15, 4.4],
    lookAt: [0.2, 0.88, 6.0],
    fovOverride: 44,
  },
  {
    id: 'TARGET_WINDSHIELD',
    label: 'FORWARD PERSPECTIVE',
    system: 'OPTICAL DRIVING APERTURE',
    description:
      'Full-width laminated windshield with integrated UV protection, providing an unobstructed 180° forward panoramic driving view.',
    cameraPosition: [-0.1, 1.12, 4.9],
    lookAt: [0.0, 1.05, 9.0],
    fovOverride: 46,
  },
] as const
