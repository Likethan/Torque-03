import * as THREE from 'three'
import { clamp } from '../../motion/clamp'

/**
 * ----------------------------------------------------------------------------
 * EXPLODED ENGINEERING COMPONENTS REGISTRY (Step 9 — Exploded View)
 * ----------------------------------------------------------------------------
 * Centralized engineering component configuration for the 2003 Honda Accord
 * J30A4 3.0L V6 VTEC powertrain and chassis carrier assembly.
 *
 * Core Principles:
 * 1. Only actual physical components from the 3D model hierarchy are included.
 * 2. Specifications are 100% authentic to the factory 2003 Honda Accord (7th Gen).
 * 3. Explosion vectors are calculated from component center relative to assembly
 *    origin, resulting in deliberate, physically believable mechanical separation.
 * 4. Priority-based staging ensures outer housings separate first before internal
 *    kinematic valvetrain elements are revealed.
 */

export interface EngineeringComponentConfig {
  id: string
  label: string
  system: string
  category: 'POWERTRAIN' | 'VALVETRAIN' | 'TIMING' | 'CHASSIS'
  description: string
  specs: { label: string; value: string }[]
  meshNames: string[]
  nominalPosition: [number, number, number]
  explosionVector: [number, number, number]
  maxDistance: number
  priority: number // 1: separates earliest, 4: separates latest
}

export const ENGINEERING_COMPONENTS: readonly EngineeringComponentConfig[] = [
  {
    id: 'valve-cover',
    label: 'UPPER VALVE COVER & PLENUM',
    system: 'CYLINDER HEAD ENCLOSURE',
    category: 'POWERTRAIN',
    description:
      'Precision die-cast magnesium-aluminum alloy cover with integrated baffle channels, synthetic rubber perimeter gasket, and cast VTEC branding plate.',
    specs: [
      { label: 'MATERIAL', value: 'Die-Cast Aluminum-Magnesium' },
      { label: 'ACOUSTIC SHIELDING', value: 'Composite Resonator Dampers' },
      { label: 'FASTENERS', value: '6x High-Tensile Flange Bolts' },
    ],
    meshNames: ['VALVE_COVER_TOP', 'UPPER_VALVE_COVER_GROUP'],
    nominalPosition: [0, 0.88, 0],
    explosionVector: [0, 1, 0], // Lifts straight up along +Y
    maxDistance: 0.52,
    priority: 1,
  },
  {
    id: 'bearing-caps',
    label: 'CAM JOURNAL BEARING CAPS',
    system: 'HYDRODYNAMIC CAMSHAFT SUPPORTS',
    category: 'POWERTRAIN',
    description:
      'Split-line precision-machined aluminum journal bearing caps engineered to maintain 0.025mm hydrodynamic oil wedge clearance under 6,500 RPM full-load operation.',
    specs: [
      { label: 'CLEARANCE', value: '0.025 – 0.042 mm Oil Film' },
      { label: 'JOURNAL DIAMETER', value: 'Ø32.0 mm Machined Bore' },
      { label: 'LUBRICATION', value: 'Pressurized Oil Feed Gallery' },
    ],
    meshNames: ['BEARING_CAPS_GROUP'],
    nominalPosition: [0, 0.38, 0],
    explosionVector: [0, 1, 0], // Lifts straight up along +Y
    maxDistance: 0.32,
    priority: 2,
  },
  {
    id: 'camshaft',
    label: 'VTEC ROTATING CAMSHAFT',
    system: 'VARIABLE VALVE TIMING & LIFT',
    category: 'VALVETRAIN',
    description:
      'Hollow-forged high-carbon steel camshaft featuring stepped dual-profile cam lobes. Hydraulic pressure locks secondary rocker followers at 4,800 RPM to engage high-lift duration.',
    specs: [
      { label: 'PRIMARY LIFT', value: '7.8 mm (Fuel Economy Mode)' },
      { label: 'VTEC HIGH LIFT', value: '11.2 mm (High RPM Breathing)' },
      { label: 'CONSTRUCTION', value: 'Hollow Chilled Cast Steel' },
    ],
    meshNames: ['ROTATING_CAMSHAFT_GROUP', 'CENTRAL_SHAFT', 'CAM_LOBE_CYL_1', 'CAM_LOBE_CYL_2'],
    nominalPosition: [0, 0.28, 0],
    explosionVector: [0, 0.3, -0.4], // Elevates slightly and angles rearward
    maxDistance: 0.24,
    priority: 3,
  },
  {
    id: 'timing-gears',
    label: 'TIMING SPROCKET & DRIVEN GEAR',
    system: 'CRANK-TO-CAM KINEMATIC DRIVE',
    category: 'TIMING',
    description:
      'Anodized high-strength alloy timing belt sprocket meshed with counter-rotating secondary reduction gear, executing an exact 1:2 drive ratio relative to the crankshaft.',
    specs: [
      { label: 'DRIVE RATIO', value: '1:2 Crankshaft Synchronization' },
      { label: 'PULLEY DIAMETER', value: 'Ø116 mm Anodized Outer Rim' },
      { label: 'INDEX REFERENCE', value: 'Championship Red TDC Mark' },
    ],
    meshNames: ['PRIMARY_DRIVE_SPROCKET', 'DRIVE_PULLEY_WHEEL', 'DRIVEN_SECONDARY_GEAR_GROUP', 'TECHNICAL_INDEX_COLLAR'],
    nominalPosition: [-1.25, 0, 0],
    explosionVector: [-1, 0.15, 0], // Clears laterally along -X
    maxDistance: 0.42,
    priority: 2,
  },
  {
    id: 'rockers',
    label: 'VTEC ROLLER ROCKER FOLLOWERS',
    system: 'LOW-FRICTION VALVE ACTUATION',
    category: 'VALVETRAIN',
    description:
      'Needle-bearing roller rocker followers pivoting on a polished chrome central rocker shaft. Internal hydraulic pistons engage at high RPM to couple the primary and secondary arms.',
    specs: [
      { label: 'BEARING TYPE', value: 'Low-Friction Needle Rollers' },
      { label: 'MAX TILT ANGLE', value: '12.6° Angular Sweep' },
      { label: 'ACTUATION', value: 'Internal Hydraulic Locking Pin' },
    ],
    meshNames: ['ROCKER_1_HINGE_GROUP', 'ROCKER_2_HINGE_GROUP', 'ROCKER_PIVOT_SHAFT'],
    nominalPosition: [0, 0.52, 0.32],
    explosionVector: [0, 0.35, 1], // Expands forward-upward along +Z, +Y
    maxDistance: 0.36,
    priority: 3,
  },
  {
    id: 'valves',
    label: 'VALVES & PROGRESSIVE SPRINGS',
    system: 'COMBUSTION GAS EXCHANGE',
    category: 'VALVETRAIN',
    description:
      'Lightweight sodium-cooled exhaust valves and multi-angle intake valves seated against hardened sintered alloy inserts, controlled by dual progressive silicon-chrome springs.',
    specs: [
      { label: 'VALVE STROKE', value: '11.2 mm Peak Mechanical Travel' },
      { label: 'SPRING SPEC', value: 'Dual Progressive Silicon-Chrome' },
      { label: 'MATERIAL', value: 'Heat-Resistant Stellite Face' },
    ],
    meshNames: ['LINEAR_VALVE_1', 'LINEAR_VALVE_2', 'SECONDARY_VALVE_BANK'],
    nominalPosition: [0, 0.42, 0.52],
    explosionVector: [0, -0.45, 0.8], // Descends outward along +Z, -Y
    maxDistance: 0.38,
    priority: 4,
  },
  {
    id: 'subframe-carrier',
    label: 'SUBFRAME CARRIER CRADLE',
    system: 'STRUCTURAL MONOCOQUE FOUNDATION',
    category: 'CHASSIS',
    description:
      'High-rigidity stamped high-tensile steel carrier housing the valvetrain assembly and mounting directly to the front double-wishbone subframe through liquid-filled rubber bushings.',
    specs: [
      { label: 'MATERIAL', value: 'High-Tensile Stamped Steel' },
      { label: 'MOUNTING', value: 'Hydroformed Vibration Isolation Lugs' },
      { label: 'TORSIONAL RIGIDITY', value: '+27% over 6th Generation' },
    ],
    meshNames: ['BASE_CARRIER_BLOCK', 'LEFT_LUG', 'RIGHT_LUG'],
    nominalPosition: [0, -0.4, 0],
    explosionVector: [0, -1, 0], // Anchored base settles downward slightly
    maxDistance: 0.16,
    priority: 1,
  },
]

export const COMPONENT_MAP = new Map<string, EngineeringComponentConfig>(
  ENGINEERING_COMPONENTS.map((c) => [c.id, c])
)

// Reusable static vector to avoid GC allocations during render loops
const staticOffset = new THREE.Vector3()

/**
 * Computes the 3D explosion displacement vector for a given component configuration
 * and progress value (0.0 to 1.0).
 *
 * Uses staggered priority easing:
 * - Priority 1 (housings): starts at p = 0.00, peaks at p = 0.65
 * - Priority 2 (journals/gears): starts at p = 0.15, peaks at p = 0.78
 * - Priority 3 (camshaft/rockers): starts at p = 0.25, peaks at p = 0.90
 * - Priority 4 (valves/internals): starts at p = 0.35, peaks at p = 1.00
 */
export function computeExplosionOffset(
  component: EngineeringComponentConfig,
  progress: number,
  scaleFactor = 1.0,
  outVector: THREE.Vector3 = staticOffset
): THREE.Vector3 {
  const p = clamp(progress, 0, 1)

  // Calculate staggered progress window based on priority
  const startP = (component.priority - 1) * 0.10
  const endP = Math.min(startP + 0.65, 1.0)

  let localT = 0
  if (p > startP) {
    localT = (p - startP) / (endP - startP)
    localT = clamp(localT, 0, 1)
  }

  // Smooth cubic ease-out curve for mechanical weight and precision
  const ease = localT * localT * (3 - 2 * localT)

  const distance = component.maxDistance * ease * scaleFactor

  outVector.set(
    component.explosionVector[0] * distance,
    component.explosionVector[1] * distance,
    component.explosionVector[2] * distance
  )

  return outVector
}
