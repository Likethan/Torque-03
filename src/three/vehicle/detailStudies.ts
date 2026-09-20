import * as THREE from 'three'
import type { DetailStudyId, DetailStudyConfig } from './vehicleTypes'

/**
 * ----------------------------------------------------------------------------
 * DETAIL STUDIES REGISTRY (Step 13 — Advanced Automotive Detail Systems)
 * ----------------------------------------------------------------------------
 * 9 authored close-up automotive camera studies.
 * Each study specifies:
 * - Macro camera eye & lookAt target coordinates
 * - Precision optical FOV (24° to 44°)
 * - Studio lighting modifier parameters (key softbox shift, rim edge glint, cavity fill)
 * - Zero-allocation sample function for smooth camera rig transitions.
 */

export const DETAIL_STUDIES: Record<DetailStudyId, DetailStudyConfig> = {
  FRONT_STUDY: {
    id: 'FRONT_STUDY',
    index: '01',
    title: 'AERODYNAMIC FRONT FASCIA',
    subtitle: 'Front three-quarters wedge profile & hood center crease',
    description:
      'Low-drag front architecture featuring sculpted hood lines, tapered front bumper air dam, and a unified 0.30 Cd aerodynamic signature.',
    primaryComponent: 'BODY_HOOD',
    cameraPosition: [-1.8, 0.95, 3.8],
    cameraTarget: [0.0, 0.45, 1.8],
    fov: 34,
    pointerScale: 0.4,
    keyLightModifier: {
      positionOffset: [2.0, 1.5, 1.0],
      intensityMultiplier: 1.2,
      color: '#ffffff',
    },
    rimLightModifier: {
      positionOffset: [-1.0, 1.0, -1.0],
      intensityMultiplier: 1.1,
    },
    fillLightModifier: {
      positionOffset: [0.0, -0.5, 1.0],
      intensityMultiplier: 1.0,
    },
  },
  HEADLIGHT_STUDY: {
    id: 'HEADLIGHT_STUDY',
    index: '02',
    title: 'MULTI-REFLECTOR HEADLAMP',
    subtitle: 'High-intensity dual halogen optics & fluted polycarbonate lens',
    description:
      'High-precision parabolic reflector buckets housed behind UV-treated fluted polycarbonate lenses, throwing calibrated dual-beam illumination.',
    primaryComponent: 'HEADLIGHTS',
    cameraPosition: [-1.25, 0.62, 3.1],
    cameraTarget: [-0.68, 0.48, 2.3],
    fov: 26,
    pointerScale: 0.25,
    keyLightModifier: {
      positionOffset: [1.0, 0.8, 0.5],
      intensityMultiplier: 1.35,
      color: '#f8fafc',
    },
    rimLightModifier: {
      positionOffset: [-1.5, 0.5, 0.0],
      intensityMultiplier: 1.4,
    },
    fillLightModifier: {
      positionOffset: [0.0, -0.3, 0.8],
      intensityMultiplier: 1.1,
    },
  },
  GRILLE_STUDY: {
    id: 'GRILLE_STUDY',
    index: '03',
    title: 'PENTAGONAL CHEVRON GRILLE',
    subtitle: 'Electroplated chrome surround & Honda emblem',
    description:
      'Signature 7th-gen pentagonal chevron grille framed in polished chrome, with an anodized dark honeycomb mesh intake.',
    primaryComponent: 'FRONT_GRILLE',
    cameraPosition: [0.0, 0.55, 3.4],
    cameraTarget: [0.0, 0.45, 2.35],
    fov: 28,
    pointerScale: 0.3,
    keyLightModifier: {
      positionOffset: [0.0, 2.0, 0.5],
      intensityMultiplier: 1.25,
      color: '#ffffff',
    },
    rimLightModifier: {
      positionOffset: [-2.0, 1.0, 0.0],
      intensityMultiplier: 1.0,
    },
    fillLightModifier: {
      positionOffset: [0.0, -0.6, 0.5],
      intensityMultiplier: 1.2,
    },
  },
  WHEEL_STUDY: {
    id: 'WHEEL_STUDY',
    index: '04',
    title: '16" 7-SPOKE ALLOY WHEEL',
    subtitle: 'Cast aluminum alloy & 205/60R16 radial tire',
    description:
      'Lightweight cast alloy architecture with 7 aerodynamic radial spokes, machined center hub cap, and all-season radial tire sidewall.',
    primaryComponent: 'WHEELS',
    cameraPosition: [-1.75, 0.38, 1.37],
    cameraTarget: [-0.82, 0.32, 1.37],
    fov: 30,
    pointerScale: 0.3,
    keyLightModifier: {
      positionOffset: [-1.0, 1.5, 0.5],
      intensityMultiplier: 1.3,
      color: '#f0f4f8',
    },
    rimLightModifier: {
      positionOffset: [0.0, 1.0, -1.0],
      intensityMultiplier: 1.1,
    },
    fillLightModifier: {
      positionOffset: [-0.8, -0.4, 0.0],
      intensityMultiplier: 1.4, // Reveal cavity between wheel spokes
    },
  },
  BRAKE_STUDY: {
    id: 'BRAKE_STUDY',
    index: '05',
    title: 'VENTILATED DISC & CALIPER',
    subtitle: '282mm ventilated steel rotor & 57mm hydraulic piston',
    description:
      'Internal radial cooling vanes vent thermal energy during severe stops, while the rigid cast iron caliper delivers progressive pedal modulation.',
    primaryComponent: 'BRAKES',
    cameraPosition: [-1.42, 0.35, 1.45],
    cameraTarget: [-0.78, 0.32, 1.37],
    fov: 24,
    pointerScale: 0.2,
    keyLightModifier: {
      positionOffset: [-0.5, 1.2, 0.2],
      intensityMultiplier: 1.4,
      color: '#ffffff',
    },
    rimLightModifier: {
      positionOffset: [0.0, 0.8, -0.8],
      intensityMultiplier: 1.2,
    },
    fillLightModifier: {
      positionOffset: [-0.5, -0.2, 0.1],
      intensityMultiplier: 1.6, // Deep cavity illumination for brake rotor
    },
  },
  BODYLINE_STUDY: {
    id: 'BODYLINE_STUDY',
    index: '06',
    title: 'WEDGE SHOULDER CREASE',
    subtitle: 'Satin Silver Metallic clearcoat & flush door handles',
    description:
      'Continuous aerodynamic shoulder line creating a dynamic light shelf across the flanks, complemented by factory Satin Silver Metallic NH-623M depth.',
    primaryComponent: 'DOORS_FLANK',
    cameraPosition: [-2.1, 0.82, -0.2],
    cameraTarget: [-0.91, 0.58, 0.4],
    fov: 32,
    pointerScale: 0.35,
    keyLightModifier: {
      positionOffset: [-1.5, 2.5, 1.5],
      intensityMultiplier: 1.3,
      color: '#f5f7fa',
    },
    rimLightModifier: {
      positionOffset: [1.0, 1.5, -2.0],
      intensityMultiplier: 1.4, // Strong rim separator glint along the wedge
    },
    fillLightModifier: {
      positionOffset: [-1.0, -0.8, 0.0],
      intensityMultiplier: 0.9,
    },
  },
  REAR_LIGHT_STUDY: {
    id: 'REAR_LIGHT_STUDY',
    index: '07',
    title: 'JEWEL TAILLIGHT & DUAL EXHAUST',
    subtitle: 'Faceted optical ruby prisms & polished chrome tips',
    description:
      'Multi-chamber jewel taillights providing luminous night definition, anchored by dual resonated stainless exhaust tips signifying the VTEC V6.',
    primaryComponent: 'TAILLIGHTS',
    cameraPosition: [-1.4, 0.75, -3.2],
    cameraTarget: [-0.72, 0.52, -2.34],
    fov: 28,
    pointerScale: 0.3,
    keyLightModifier: {
      positionOffset: [-1.0, 1.8, -1.0],
      intensityMultiplier: 1.2,
      color: '#edf2f7',
    },
    rimLightModifier: {
      positionOffset: [1.5, 1.0, 1.0],
      intensityMultiplier: 1.25,
    },
    fillLightModifier: {
      positionOffset: [-0.5, -0.5, -1.0],
      intensityMultiplier: 1.1,
    },
  },
  GLASS_STUDY: {
    id: 'GLASS_STUDY',
    index: '08',
    title: 'ACOUSTIC GREENHOUSE & MIRROR',
    subtitle: 'Solar-tint laminated glass & sculpted aerodynamic mirror',
    description:
      'Smooth acoustic windshield and side windows reducing interior noise levels, paired with wind-tunnel contoured aerodynamic side mirrors.',
    primaryComponent: 'GLASS',
    cameraPosition: [-1.6, 1.25, 0.9],
    cameraTarget: [-0.5, 0.86, 0.5],
    fov: 34,
    pointerScale: 0.35,
    keyLightModifier: {
      positionOffset: [0.0, 3.0, 1.0],
      intensityMultiplier: 1.2,
      color: '#ffffff',
    },
    rimLightModifier: {
      positionOffset: [-2.0, 1.5, -1.0],
      intensityMultiplier: 1.3,
    },
    fillLightModifier: {
      positionOffset: [0.0, -0.5, 0.0],
      intensityMultiplier: 1.0,
    },
  },
  INTERIOR_STUDY: {
    id: 'INTERIOR_STUDY',
    index: '09',
    title: 'DRIVER-CENTRIC COCKPIT',
    subtitle: '3-spoke steering wheel & LED backlit instrument dials',
    description:
      'Tactile driver ergonomics including metallic gauge bezels, illuminated tachometer and speedometer, and intuitive center stack controls.',
    primaryComponent: 'INTERIOR_CABIN',
    cameraPosition: [-0.15, 0.95, 0.05],
    cameraTarget: [-0.35, 0.65, 0.8],
    fov: 44,
    pointerScale: 0.25,
    keyLightModifier: {
      positionOffset: [0.0, 1.0, 0.0],
      intensityMultiplier: 0.8,
      color: '#ffffff',
    },
    rimLightModifier: {
      positionOffset: [0.0, 0.5, 0.0],
      intensityMultiplier: 0.6,
    },
    fillLightModifier: {
      positionOffset: [-0.2, 0.4, 0.3],
      intensityMultiplier: 1.5, // Warm cabin illumination
    },
  },
}

export const ORDERED_STUDY_IDS: DetailStudyId[] = [
  'FRONT_STUDY',
  'HEADLIGHT_STUDY',
  'GRILLE_STUDY',
  'WHEEL_STUDY',
  'BRAKE_STUDY',
  'BODYLINE_STUDY',
  'REAR_LIGHT_STUDY',
  'GLASS_STUDY',
  'INTERIOR_STUDY',
]

/**
 * Evaluates detail study camera position, target, and FOV into pre-allocated vectors.
 * Returns true if a study was successfully evaluated.
 */
export function sampleDetailChoreography(
  studyId: DetailStudyId,
  targetPos: THREE.Vector3,
  targetLookAt: THREE.Vector3,
  responsiveScale = 1.0
): { fov: number; pointerScale: number } {
  const config = DETAIL_STUDIES[studyId]
  if (!config) {
    return { fov: 38, pointerScale: 1.0 }
  }

  // Scale eye position outward slightly on smaller screens
  targetPos.set(
    config.cameraPosition[0] * responsiveScale,
    config.cameraPosition[1],
    config.cameraPosition[2] * responsiveScale
  )
  targetLookAt.set(
    config.cameraTarget[0],
    config.cameraTarget[1],
    config.cameraTarget[2]
  )

  return {
    fov: config.fov,
    pointerScale: config.pointerScale,
  }
}
