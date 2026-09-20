import type { CameraStateId } from './cameraTypes'

/**
 * ----------------------------------------------------------------------------
 * INTERIOR CAMERA WAYPOINTS (Step 10 — Interior Camera Transition)
 * ----------------------------------------------------------------------------
 * 7 cinematic waypoints defining the continuous camera journey from
 * exterior hero position through the driver door region, into the cabin,
 * through the interior focal points, and eventually to exit position.
 *
 * Coordinates match the engineering assembly world space:
 * - Origin (0,0,0) = center of engineering assembly
 * - Cabin positioned at Z ≈ +3.5 offset (forward of powertrain)
 * - Driver side = -X, Passenger = +X
 * - Up = +Y
 *
 * Entry Path: Side approach → driver window region → cabin threshold →
 * driver H-point → dashboard focus → windshield panorama
 */

export interface InteriorWaypoint {
  id: CameraStateId
  chapter: string
  title: string
  subtitle: string
  range: { start: number; end: number }
  position: [number, number, number]
  target: [number, number, number]
  description: string
  fovOverride: number
  /** Pointer parallax scale (0.0 = disabled, 1.0 = full exterior scale) */
  pointerScale: number
}

export const INTERIOR_WAYPOINTS: InteriorWaypoint[] = [
  {
    id: 'INTERIOR_APPROACH',
    chapter: 'INT-01',
    title: 'VEHICLE APPROACH',
    subtitle: 'Camera descends toward the driver-side door',
    range: { start: 0.0, end: 0.15 },
    position: [3.2, 1.8, 4.2],
    target: [0.0, 0.85, 4.8],
    description:
      'The camera transitions from the engineering hero position toward the vehicle body, orienting to reveal the driver-side entry point.',
    fovOverride: 38,
    pointerScale: 0.8,
  },
  {
    id: 'INTERIOR_THRESHOLD',
    chapter: 'INT-02',
    title: 'WINDOW THRESHOLD',
    subtitle: 'Camera arrives at the driver-side glass boundary',
    range: { start: 0.15, end: 0.30 },
    position: [-1.1, 1.15, 5.2],
    target: [0.0, 0.95, 5.8],
    description:
      'The camera approaches the driver-side window glass, preparing to cross the exterior boundary into the cabin space.',
    fovOverride: 40,
    pointerScale: 0.5,
  },
  {
    id: 'INTERIOR_ENTRY',
    chapter: 'INT-03',
    title: 'CABIN ENTRY',
    subtitle: 'Crossing the glass boundary into the passenger compartment',
    range: { start: 0.30, end: 0.45 },
    position: [-0.55, 1.12, 5.0],
    target: [0.1, 0.92, 6.2],
    description:
      'The camera physically crosses the driver-side window boundary and enters the cabin. Lighting shifts to interior ambience.',
    fovOverride: 42,
    pointerScale: 0.3,
  },
  {
    id: 'INTERIOR_CABIN',
    chapter: 'INT-04',
    title: 'DRIVER POSITION',
    subtitle: 'Settling into the human-scale driver H-point',
    range: { start: 0.45, end: 0.58 },
    position: [-0.35, 1.12, 4.8],
    target: [0.0, 0.95, 7.5],
    description:
      'The camera reaches the driver\'s seated eye height, creating a natural, human-scale forward perspective through the windshield.',
    fovOverride: 42,
    pointerScale: 0.2,
  },
  {
    id: 'INTERIOR_DASHBOARD',
    chapter: 'INT-05',
    title: 'DASHBOARD ARCHITECTURE',
    subtitle: 'Subtle rotation toward the horizontal instrument datum',
    range: { start: 0.58, end: 0.72 },
    position: [-0.25, 1.10, 4.6],
    target: [0.05, 0.88, 5.8],
    description:
      'The camera subtly redirects attention toward the dashboard, revealing the instrument cluster, steering column, and HVAC controls.',
    fovOverride: 40,
    pointerScale: 0.15,
  },
  {
    id: 'INTERIOR_WINDSHIELD',
    chapter: 'INT-06',
    title: 'FORWARD PANORAMA',
    subtitle: 'Final interior composition with environmental depth',
    range: { start: 0.72, end: 0.88 },
    position: [-0.15, 1.14, 4.9],
    target: [0.0, 1.02, 9.0],
    description:
      'The camera lifts to look through the windshield, establishing exterior-through-window depth. The cabin becomes a frame for the driving world.',
    fovOverride: 44,
    pointerScale: 0.25,
  },
  {
    id: 'INTERIOR_EXIT',
    chapter: 'INT-07',
    title: 'CABIN DEPARTURE',
    subtitle: 'Smooth pullback exiting through the same entry path',
    range: { start: 0.88, end: 1.0 },
    position: [1.8, 1.6, 5.5],
    target: [0.0, 0.8, 5.0],
    description:
      'The camera gracefully exits the cabin through a widening perspective, transitioning back toward the exterior environment.',
    fovOverride: 38,
    pointerScale: 0.6,
  },
]
