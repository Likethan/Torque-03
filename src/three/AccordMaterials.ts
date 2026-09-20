import * as THREE from 'three'

/**
 * ----------------------------------------------------------------------------
 * ACCORD MATERIALS MODULE (Step 14 — React Three Fiber + Drei)
 * ----------------------------------------------------------------------------
 * Centralized PBR material definitions matching the 2003 Honda Accord
 * engineering aesthetic:
 * - Dark gunmetal cast metal for monocoque subframe cradles
 * - Satin forged steel for high-strength rotating shafts
 * - High-polish chrome for low-friction VTEC cam lobes
 * - Anodized dark aluminum for precision timing drive gears
 * - Matte aluminum for hydraulic valve guide sleeves
 * - Honda Championship Red for technical indexing collar marks
 */

export interface MaterialTokens {
  castMetal: THREE.MeshStandardMaterial
  satinSteel: THREE.MeshStandardMaterial
  polishedChrome: THREE.MeshStandardMaterial
  anodizedDark: THREE.MeshStandardMaterial
  matteAluminum: THREE.MeshStandardMaterial
  championshipRed: THREE.MeshStandardMaterial
  // Step 7 & Step 13: Automotive Exterior PBR Materials
  satinSilverMetallic: THREE.MeshStandardMaterial
  automotiveGlass: THREE.MeshStandardMaterial
  headlightHousing: THREE.MeshStandardMaterial
  headlightLens: THREE.MeshStandardMaterial
  headlightEmitter: THREE.MeshStandardMaterial
  tireRubber: THREE.MeshStandardMaterial
  brakeRotor: THREE.MeshStandardMaterial
  brakeCaliper: THREE.MeshStandardMaterial
  taillightJewel: THREE.MeshStandardMaterial
  mirrorGlass: THREE.MeshStandardMaterial
}

export function createAccordMaterials(): MaterialTokens {
  return {
    castMetal: new THREE.MeshStandardMaterial({
      color: 0x242830,
      roughness: 0.52,
      metalness: 0.82,
    }),
    satinSteel: new THREE.MeshStandardMaterial({
      color: 0x8c949e,
      roughness: 0.22,
      metalness: 0.94,
    }),
    polishedChrome: new THREE.MeshStandardMaterial({
      color: 0xc8d0d8,
      roughness: 0.08,
      metalness: 0.98,
    }),
    anodizedDark: new THREE.MeshStandardMaterial({
      color: 0x1c1f24,
      roughness: 0.38,
      metalness: 0.88,
    }),
    matteAluminum: new THREE.MeshStandardMaterial({
      color: 0x58606c,
      roughness: 0.44,
      metalness: 0.72,
    }),
    championshipRed: new THREE.MeshStandardMaterial({
      color: 0xc8102e,
      roughness: 0.28,
      metalness: 0.65,
    }),
    // Step 7 & 13: Authentic 2003 Honda Satin Silver Metallic (NH-623M)
    satinSilverMetallic: new THREE.MeshStandardMaterial({
      color: 0x9ba3af,
      roughness: 0.24,
      metalness: 0.88,
    }),
    // Readable, transparent tinted automotive glass with environmental reflection
    automotiveGlass: new THREE.MeshStandardMaterial({
      color: 0x141a22,
      roughness: 0.06,
      metalness: 0.22,
      transparent: true,
      opacity: 0.72,
    }),
    // Molded chrome headlight parabolic reflector bucket
    headlightHousing: new THREE.MeshStandardMaterial({
      color: 0xb8c2cc,
      roughness: 0.12,
      metalness: 0.96,
    }),
    // Fluted optical polycarbonate headlight lens
    headlightLens: new THREE.MeshStandardMaterial({
      color: 0xdde5ee,
      roughness: 0.08,
      metalness: 0.08,
      transparent: true,
      opacity: 0.68,
    }),
    // Controlled halogen filament emitter (dynamic emissiveIntensity)
    headlightEmitter: new THREE.MeshStandardMaterial({
      color: 0x1c1f24,
      emissive: new THREE.Color(0xffe6b8),
      emissiveIntensity: 0.45,
      roughness: 0.2,
    }),
    // Step 13: Radial All-Season Tire Rubber
    tireRubber: new THREE.MeshStandardMaterial({
      color: 0x141618,
      roughness: 0.86,
      metalness: 0.04,
    }),
    // Step 13: Ventilated Stainless Steel Disc Rotor
    brakeRotor: new THREE.MeshStandardMaterial({
      color: 0x9098a4,
      roughness: 0.22,
      metalness: 0.95,
    }),
    // Step 13: Nodular Iron Hydraulic Brake Caliper
    brakeCaliper: new THREE.MeshStandardMaterial({
      color: 0x22262c,
      roughness: 0.52,
      metalness: 0.78,
    }),
    // Step 13: Dual-Chamber Jewel Ruby Taillight
    taillightJewel: new THREE.MeshStandardMaterial({
      color: 0x8a0e1e,
      emissive: new THREE.Color(0xd4142a),
      emissiveIntensity: 0.85,
      roughness: 0.12,
      metalness: 0.1,
    }),
    // Step 13: Convex Aspherical Mirror Glass
    mirrorGlass: new THREE.MeshStandardMaterial({
      color: 0xa8b4c2,
      roughness: 0.04,
      metalness: 0.98,
    }),
  }
}
