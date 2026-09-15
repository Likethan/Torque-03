import type { CameraWaypoint } from './cameraTypes'

/**
 * ----------------------------------------------------------------------------
 * CAMERA WAYPOINTS REGISTRY (Step 15 — 3D Choreography)
 * ----------------------------------------------------------------------------
 * Canonical sequence of 8 cinematic camera waypoints carefully composed
 * around the 2003 Honda Accord engineering assembly and coordinate bounds.
 *
 * Each waypoint provides:
 * - Specific global progress range [start, end]
 * - Camera eye position [X, Y, Z]
 * - LookAt focal target [X, Y, Z]
 * - Restrained component separation / elevation offset (meters)
 * - Assembly azimuth angle (radians)
 */

export const CAMERA_WAYPOINTS: CameraWaypoint[] = [
  {
    id: 'ARRIVAL',
    chapter: 'CH-01',
    title: 'ARRIVAL & AWAKENING',
    subtitle: 'Atmospheric wide establishing perspective',
    range: { start: 0.0, end: 0.15 },
    position: [5.2, 3.2, 6.4],
    target: [0.0, 0.0, 0.0],
    description: 'Wide establishing vantage. Assembly is small within the dark studio with large negative space.',
    componentElevation: 0.0,
    assemblyAzimuth: 0.0,
  },
  {
    id: 'APPROACH',
    chapter: 'CH-02',
    title: 'STUDIO APPROACH',
    subtitle: 'Front-quarter perspective descent',
    range: { start: 0.15, end: 0.3 },
    position: [3.6, 2.0, 4.4],
    target: [0.0, 0.0, 0.0],
    description: 'Camera descends smoothly toward the front three-quarters, establishing engineering proportions.',
    componentElevation: 0.0,
    assemblyAzimuth: 0.25,
  },
  {
    id: 'FORM',
    chapter: 'CH-03',
    title: 'SCULPTED FORM',
    subtitle: 'Low aerodynamic glide along the wedge profile',
    range: { start: 0.3, end: 0.45 },
    position: [2.6, 1.2, 3.2],
    target: [0.3, 0.1, 0.0],
    description: 'Low-angle tracking shot along the aerodynamic flank, emphasizing surface tension and machined radii.',
    componentElevation: 0.04,
    assemblyAzimuth: 0.5,
  },
  {
    id: 'ARCHITECTURE',
    chapter: 'CH-04',
    title: 'MONOCOQUE CHASSIS',
    subtitle: 'Elevated isometric structural inspection',
    range: { start: 0.45, end: 0.6 },
    position: [1.8, 3.4, 2.6],
    target: [0.0, -0.2, 0.0],
    description: 'Elevated technical perspective. Subframe carrier cradles the camshaft with subtle valve guide separation.',
    componentElevation: 0.18,
    assemblyAzimuth: 0.95,
  },
  {
    id: 'POWERTRAIN',
    chapter: 'CH-05',
    title: 'POWERTRAIN HEART',
    subtitle: 'Macro focus on VTEC camshaft & eccentric lobes',
    range: { start: 0.6, end: 0.72 },
    position: [0.8, 1.3, 1.8],
    target: [0.0, 0.28, 0.0],
    description: 'Close-in technical inspection of the J30A4 dual-stage VTEC lobes and polished friction surfaces.',
    componentElevation: 0.18,
    assemblyAzimuth: 1.55,
  },
  {
    id: 'MECHANICAL',
    chapter: 'CH-06',
    title: 'AXIAL KINEMATICS',
    subtitle: 'Centerline elevation of timing gear & index collar',
    range: { start: 0.72, end: 0.84 },
    position: [-2.4, 0.8, 1.4],
    target: [-0.6, 0.28, 0.0],
    description: 'Direct axial centerline perspective highlighting the anodized timing pulley and Championship Red collar.',
    componentElevation: 0.12,
    assemblyAzimuth: 2.35,
  },
  {
    id: 'RECONSTRUCTION',
    chapter: 'CH-07',
    title: 'STRUCTURAL RECONSTRUCTION',
    subtitle: 'Camera pull-back as components reseat into cradle',
    range: { start: 0.84, end: 0.94 },
    position: [2.8, 2.4, 4.6],
    target: [0.0, 0.0, 0.0],
    description: 'Camera smoothly pulls back as the elevated valve sleeves reseat cleanly into the monocoque carrier.',
    componentElevation: 0.0,
    assemblyAzimuth: 2.85,
  },
  {
    id: 'FINAL',
    chapter: 'CH-08',
    title: 'HERO EQUILIBRIUM',
    subtitle: 'Harmonious archive composition',
    range: { start: 0.94, end: 1.0 },
    position: [3.2, 1.8, 4.2],
    target: [0.0, 0.0, 0.0],
    description: 'Unified mechanical system settled in balanced studio equilibrium, transitioning into detailed specs.',
    componentElevation: 0.0,
    assemblyAzimuth: 3.14,
  },
]
