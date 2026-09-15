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
      color: 0xb5bec8,
      roughness: 0.14,
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
  }
}
