import * as THREE from 'three'
import type { DetailStudyId } from './vehicleTypes'
import { DETAIL_STUDIES } from './detailStudies'

/**
 * ----------------------------------------------------------------------------
 * VEHICLE LIGHTING CONTROLLER (Step 13 — Advanced Automotive Detail Systems)
 * ----------------------------------------------------------------------------
 * Coordinates anticipatory studio lighting passes during close-up camera studies.
 *
 * Implements Requirements 26, 27, 28, 30 & 31:
 * - Anticipates close-up focal geometry:
 *   - Wheels & Brakes: redirects fill light into wheel spoke cavities (1.4x-1.6x)
 *   - Headlights & Grille: aligns key light with chrome and fluted polycarbonate
 *   - Bodyline: sharpens rim light glint along the wedge shoulder crease
 *   - Cockpit: warms interior fill and dims harsh exterior key
 * - Zero allocations in useFrame loops
 */

// Pre-allocated static vectors & colors
const vKeyTarget = new THREE.Vector3()
const vRimTarget = new THREE.Vector3()
const vFillTarget = new THREE.Vector3()
const cKeyStudy = new THREE.Color()

export function computeStudyLightingModifiers(
  studyId: DetailStudyId,
  blend: number,
  baseKeyPos: THREE.Vector3,
  baseRimPos: THREE.Vector3,
  baseFillPos: THREE.Vector3,
  outKeyPos: THREE.Vector3,
  outRimPos: THREE.Vector3,
  outFillPos: THREE.Vector3
): {
  keyIntensityMult: number
  rimIntensityMult: number
  fillIntensityMult: number
  studyKeyColor?: THREE.Color
} {
  const config = DETAIL_STUDIES[studyId]
  if (!config || blend <= 0.001) {
    outKeyPos.copy(baseKeyPos)
    outRimPos.copy(baseRimPos)
    outFillPos.copy(baseFillPos)
    return {
      keyIntensityMult: 1.0,
      rimIntensityMult: 1.0,
      fillIntensityMult: 1.0,
    }
  }

  // Target positions with study offsets
  vKeyTarget.set(
    config.cameraTarget[0] + config.keyLightModifier.positionOffset[0],
    config.cameraTarget[1] + config.keyLightModifier.positionOffset[1],
    config.cameraTarget[2] + config.keyLightModifier.positionOffset[2]
  )
  vRimTarget.set(
    config.cameraTarget[0] + config.rimLightModifier.positionOffset[0],
    config.cameraTarget[1] + config.rimLightModifier.positionOffset[1],
    config.cameraTarget[2] + config.rimLightModifier.positionOffset[2]
  )
  vFillTarget.set(
    config.cameraTarget[0] + config.fillLightModifier.positionOffset[0],
    config.cameraTarget[1] + config.fillLightModifier.positionOffset[1],
    config.cameraTarget[2] + config.fillLightModifier.positionOffset[2]
  )

  outKeyPos.lerpVectors(baseKeyPos, vKeyTarget, blend)
  outRimPos.lerpVectors(baseRimPos, vRimTarget, blend)
  outFillPos.lerpVectors(baseFillPos, vFillTarget, blend)

  const keyMult = THREE.MathUtils.lerp(1.0, config.keyLightModifier.intensityMultiplier, blend)
  const rimMult = THREE.MathUtils.lerp(1.0, config.rimLightModifier.intensityMultiplier, blend)
  const fillMult = THREE.MathUtils.lerp(1.0, config.fillLightModifier.intensityMultiplier, blend)

  if (config.keyLightModifier.color) {
    cKeyStudy.set(config.keyLightModifier.color)
  }

  return {
    keyIntensityMult: keyMult,
    rimIntensityMult: rimMult,
    fillIntensityMult: fillMult,
    studyKeyColor: config.keyLightModifier.color ? cKeyStudy : undefined,
  }
}
