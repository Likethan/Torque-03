import * as THREE from 'three'

/**
 * ----------------------------------------------------------------------------
 * INTERIOR CABIN MATERIALS (Step 10 — Interior Camera Transition)
 * ----------------------------------------------------------------------------
 * PBR material tokens authentic to the 2003 Honda Accord 7th Generation
 * interior cabin palette:
 *
 * - Charcoal soft-touch dashboard surface with subtle grain texture
 * - Warm dark tan leather seat and door panel trim
 * - Genuine wood-grain center console and door insert accents
 * - Instrument cluster glass with subtle anti-reflective coating
 * - Brushed aluminum trim rings and switch bezels
 * - Dark headliner fabric
 * - Dark carpet floor
 */

export interface InteriorMaterialTokens {
  /** Charcoal molded soft-touch dashboard */
  dashboardSoftTouch: THREE.MeshStandardMaterial
  /** Dark tan leather seat surfaces */
  seatLeather: THREE.MeshStandardMaterial
  /** Genuine wood-grain accent panels */
  woodGrainAccent: THREE.MeshStandardMaterial
  /** Instrument cluster glass (dark, transparent) */
  instrumentGlass: THREE.MeshStandardMaterial
  /** Brushed aluminum trim bezels */
  interiorAluminumTrim: THREE.MeshStandardMaterial
  /** Dark headliner fabric */
  headlinerFabric: THREE.MeshStandardMaterial
  /** Dark carpet floor */
  carpetFloor: THREE.MeshStandardMaterial
  /** Steering wheel leather wrap */
  steeringLeather: THREE.MeshStandardMaterial
  /** Center console dark plastic */
  consolePlastic: THREE.MeshStandardMaterial
  /** Door panel insert fabric */
  doorPanelFabric: THREE.MeshStandardMaterial
  /** Instrument cluster face (emissive gauges) */
  instrumentFace: THREE.MeshStandardMaterial
  /** A-pillar / trim plastic */
  pillarTrim: THREE.MeshStandardMaterial
}

export function createInteriorMaterials(): InteriorMaterialTokens {
  return {
    dashboardSoftTouch: new THREE.MeshStandardMaterial({
      color: 0x2a2d32,
      roughness: 0.72,
      metalness: 0.05,
    }),
    seatLeather: new THREE.MeshStandardMaterial({
      color: 0x3a332a,
      roughness: 0.65,
      metalness: 0.04,
    }),
    woodGrainAccent: new THREE.MeshStandardMaterial({
      color: 0x5c4228,
      roughness: 0.45,
      metalness: 0.12,
    }),
    instrumentGlass: new THREE.MeshStandardMaterial({
      color: 0x0a0c10,
      roughness: 0.06,
      metalness: 0.08,
      transparent: true,
      opacity: 0.55,
    }),
    interiorAluminumTrim: new THREE.MeshStandardMaterial({
      color: 0x8c949e,
      roughness: 0.28,
      metalness: 0.88,
    }),
    headlinerFabric: new THREE.MeshStandardMaterial({
      color: 0x38393d,
      roughness: 0.82,
      metalness: 0.0,
    }),
    carpetFloor: new THREE.MeshStandardMaterial({
      color: 0x1a1c1e,
      roughness: 0.88,
      metalness: 0.0,
    }),
    steeringLeather: new THREE.MeshStandardMaterial({
      color: 0x252220,
      roughness: 0.58,
      metalness: 0.06,
    }),
    consolePlastic: new THREE.MeshStandardMaterial({
      color: 0x22252a,
      roughness: 0.62,
      metalness: 0.08,
    }),
    doorPanelFabric: new THREE.MeshStandardMaterial({
      color: 0x2e2c28,
      roughness: 0.75,
      metalness: 0.02,
    }),
    instrumentFace: new THREE.MeshStandardMaterial({
      color: 0x0c0e12,
      roughness: 0.35,
      metalness: 0.1,
      emissive: new THREE.Color(0x1a3a2a),
      emissiveIntensity: 0.0, // Animated during interior sequence
    }),
    pillarTrim: new THREE.MeshStandardMaterial({
      color: 0x2c2e32,
      roughness: 0.68,
      metalness: 0.04,
    }),
  }
}
