import * as THREE from 'three'

/**
 * ----------------------------------------------------------------------------
 * THREE.JS OBJECTS & HIERARCHY MODULE (Step 13 — 3D Foundation)
 * ----------------------------------------------------------------------------
 * Core Three.js Concepts:
 * 1. Geometry: Defines vertex positions, normals, and UVs (the 3D shape).
 * 2. Material: Defines optical and lighting reaction (color, roughness, metalness).
 * 3. Mesh: Combines a Geometry + Material into a renderable 3D instance in the scene.
 * 4. Group / Object3D: Container nodes that form a scene graph hierarchy.
 *
 * Scene Graph Inheritance:
 * Child objects inside a Group inherit the parent's world matrix. When the parent
 * is moved, rotated, or scaled, all children transform in unison relative to the
 * parent's origin. This enables realistic mechanical kinematics:
 *
 * ENGINEERING_ASSEMBLY (Parent Group — controlled by ScrollTrigger and Pointer Tilt)
 *   ├── MAIN_CARRIER_BODY (Subframe / block base)
 *   ├── ROTATING_SHAFT_GROUP (Rotates around its central axis in the unified RAF loop)
 *   │     ├── CENTRAL_SHAFT
 *   │     ├── TIMING_PULLEY_WHEEL
 *   │     ├── VTEC_CAM_LOBE_PRIMARY (Eccentric offset)
 *   │     └── VTEC_CAM_LOBE_SECONDARY (Eccentric offset)
 *   ├── SECONDARY_VALVE_BANK (Twin hydraulic valve guide sleeves)
 *   └── DETAIL_ACCENT_COLLAR (Honda Championship Red timing index ring)
 */

export interface EngineeringAssemblyResult {
  assembly: THREE.Group
  rotatingShaftGroup: THREE.Group
  geometries: THREE.BufferGeometry[]
  materials: THREE.Material[]
  meshCount: number
}

/**
 * Creates the hierarchical 2003 Honda Accord engineering powertrain assembly.
 */
export function createEngineeringAssembly(): EngineeringAssemblyResult {
  const geometries: THREE.BufferGeometry[] = []
  const materials: THREE.Material[] = []
  let meshCount = 0

  function trackMesh<T extends THREE.Mesh>(mesh: T): T {
    geometries.push(mesh.geometry)
    if (Array.isArray(mesh.material)) {
      materials.push(...mesh.material)
    } else {
      materials.push(mesh.material)
    }
    meshCount++
    return mesh
  }

  // Root Assembly Group
  const assembly = new THREE.Group()
  assembly.name = 'ENGINEERING_ASSEMBLY'
  assembly.position.set(0, 0, 0)

  // --------------------------------------------------------------------------
  // 1. SHARED MATERIALS (Muted automotive studio palette)
  // --------------------------------------------------------------------------
  // Cast dark gunmetal subframe finish (Accord engine cradle aesthetic)
  const castMetalMat = new THREE.MeshStandardMaterial({
    color: 0x242830,
    roughness: 0.52,
    metalness: 0.82,
  })

  // Satin machined forged steel (camshaft)
  const satinSteelMat = new THREE.MeshStandardMaterial({
    color: 0x8c949e,
    roughness: 0.22,
    metalness: 0.94,
  })

  // High-polish chrome finish (eccentric cam lobes)
  const polishedChromeMat = new THREE.MeshStandardMaterial({
    color: 0xb5bec8,
    roughness: 0.14,
    metalness: 0.98,
  })

  // Anodized dark aluminum (timing drive gear)
  const anodizedDarkMat = new THREE.MeshStandardMaterial({
    color: 0x1c1f24,
    roughness: 0.38,
    metalness: 0.88,
  })

  // Matte aluminum (valve guide sleeves)
  const matteAluminumMat = new THREE.MeshStandardMaterial({
    color: 0x58606c,
    roughness: 0.44,
    metalness: 0.72,
  })

  // Restrained Honda Championship Red technical accent (timing collar index)
  const championshipRedMat = new THREE.MeshStandardMaterial({
    color: 0xc8102e,
    roughness: 0.28,
    metalness: 0.65,
  })

  // --------------------------------------------------------------------------
  // 2. MAIN BODY (Subframe / Carrier Cradle)
  // --------------------------------------------------------------------------
  const baseBlockGeom = new THREE.BoxGeometry(2.4, 0.65, 1.3)
  const baseBlock = trackMesh(new THREE.Mesh(baseBlockGeom, castMetalMat))
  baseBlock.name = 'BASE_CARRIER_BLOCK'
  baseBlock.position.set(0, -0.4, 0)
  assembly.add(baseBlock)

  // Subframe mounting lugs (left and right flanges)
  const lugGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.45, 24)
  const leftLug = trackMesh(new THREE.Mesh(lugGeom, castMetalMat))
  leftLug.position.set(-1.05, -0.2, 0.75)
  assembly.add(leftLug)

  const rightLug = trackMesh(new THREE.Mesh(lugGeom, castMetalMat))
  rightLug.position.set(1.05, -0.2, 0.75)
  assembly.add(rightLug)

  // --------------------------------------------------------------------------
  // 3. ROTATING SHAFT GROUP (The mechanical animation child group)
  // --------------------------------------------------------------------------
  const rotatingShaftGroup = new THREE.Group()
  rotatingShaftGroup.name = 'ROTATING_SHAFT_GROUP'
  // Center axis sits slightly elevated above the carrier block
  rotatingShaftGroup.position.set(0, 0.28, 0)

  // Central Camshaft (oriented along the X axis)
  const shaftGeom = new THREE.CylinderGeometry(0.14, 0.14, 2.7, 32)
  const centralShaft = trackMesh(new THREE.Mesh(shaftGeom, satinSteelMat))
  centralShaft.rotation.z = Math.PI / 2
  centralShaft.name = 'CENTRAL_SHAFT'
  rotatingShaftGroup.add(centralShaft)

  // Drive Pulley Wheel (timing sprocket at left end)
  const pulleyGeom = new THREE.CylinderGeometry(0.58, 0.58, 0.18, 36)
  const drivePulley = trackMesh(new THREE.Mesh(pulleyGeom, anodizedDarkMat))
  drivePulley.rotation.z = Math.PI / 2
  drivePulley.position.set(-1.25, 0, 0)
  drivePulley.name = 'DRIVE_PULLEY_WHEEL'
  rotatingShaftGroup.add(drivePulley)

  // Secondary Pulley Rim Collar
  const pulleyRimGeom = new THREE.TorusGeometry(0.52, 0.04, 16, 36)
  const pulleyRim = trackMesh(new THREE.Mesh(pulleyRimGeom, satinSteelMat))
  pulleyRim.rotation.y = Math.PI / 2
  pulleyRim.position.set(-1.25, 0, 0)
  rotatingShaftGroup.add(pulleyRim)

  // VTEC Cam Lobe 1 (Primary High-Lift Lobe, eccentric offset +Y)
  const lobeGeom1 = new THREE.CylinderGeometry(0.24, 0.24, 0.22, 24)
  const lobe1 = trackMesh(new THREE.Mesh(lobeGeom1, polishedChromeMat))
  lobe1.rotation.z = Math.PI / 2
  lobe1.position.set(-0.35, 0.08, 0)
  lobe1.name = 'VTEC_CAM_LOBE_PRIMARY'
  rotatingShaftGroup.add(lobe1)

  // VTEC Cam Lobe 2 (Secondary High-Lift Lobe, eccentric offset -Y)
  const lobeGeom2 = new THREE.CylinderGeometry(0.24, 0.24, 0.22, 24)
  const lobe2 = trackMesh(new THREE.Mesh(lobeGeom2, polishedChromeMat))
  lobe2.rotation.z = Math.PI / 2
  lobe2.position.set(0.35, -0.08, 0)
  lobe2.name = 'VTEC_CAM_LOBE_SECONDARY'
  rotatingShaftGroup.add(lobe2)

  // Precision Technical Index Collar (Honda Championship Red Accent)
  const indexCollarGeom = new THREE.TorusGeometry(0.22, 0.035, 16, 32)
  const indexCollar = trackMesh(new THREE.Mesh(indexCollarGeom, championshipRedMat))
  indexCollar.rotation.y = Math.PI / 2
  indexCollar.position.set(0.85, 0, 0)
  indexCollar.name = 'TECHNICAL_INDEX_COLLAR'
  rotatingShaftGroup.add(indexCollar)

  // Add the rotating group to the root assembly
  assembly.add(rotatingShaftGroup)

  // --------------------------------------------------------------------------
  // 4. SECONDARY PART (Twin Valve Guide Cylinders)
  // --------------------------------------------------------------------------
  const valveGuideGroup = new THREE.Group()
  valveGuideGroup.name = 'SECONDARY_VALVE_BANK'

  const guideGeom = new THREE.CylinderGeometry(0.16, 0.16, 0.72, 24)
  const guide1 = trackMesh(new THREE.Mesh(guideGeom, matteAluminumMat))
  guide1.position.set(-0.35, 0.65, 0)
  valveGuideGroup.add(guide1)

  const guide2 = trackMesh(new THREE.Mesh(guideGeom, matteAluminumMat))
  guide2.position.set(0.35, 0.65, 0)
  valveGuideGroup.add(guide2)

  assembly.add(valveGuideGroup)

  return {
    assembly,
    rotatingShaftGroup,
    geometries,
    materials,
    meshCount,
  }
}
