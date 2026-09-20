import { useState, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import {
  INTERIOR_TARGETS,
  CABIN_ORIGIN_OFFSET,
  type InteriorTarget,
} from './interiorTargets'
import {
  getInteriorState,
  selectInteriorTarget,
  setInteriorHovered,
  subscribeToInteriorStore,
} from './interiorStore'
import { getQualityConfig } from '../qualityTiers'
import './InteriorAnnotations.css'

/**
 * ----------------------------------------------------------------------------
 * INTERIOR SPATIAL ANNOTATIONS (Step 10 — Interior Camera Transition)
 * ----------------------------------------------------------------------------
 * Minimal, restrained technical annotations for interior focal points.
 * Uses the same spatial 3D Html pattern as ExplodedAnnotations but with
 * even more restraint — only 2–3 labels visible at a time.
 *
 * Progressive reveal: annotations appear based on interiorProgress
 * thresholds matching the camera's journey through the cabin.
 */

interface InteriorAnchorProps {
  target: InteriorTarget
  progress: number
  isSelected: boolean
  isHovered: boolean
  cabinOffset: THREE.Vector3
}

const ANNOTATION_VISIBILITY: Record<string, { showAt: number; hideAt: number }> = {
  TARGET_DRIVER: { showAt: 0.42, hideAt: 0.60 },
  TARGET_STEERING: { showAt: 0.50, hideAt: 0.70 },
  TARGET_CLUSTER: { showAt: 0.56, hideAt: 0.76 },
  TARGET_CONSOLE: { showAt: 0.48, hideAt: 0.68 },
  TARGET_DASHBOARD: { showAt: 0.58, hideAt: 0.82 },
  TARGET_WINDSHIELD: { showAt: 0.68, hideAt: 0.92 },
}

function InteriorAnchor({
  target,
  progress,
  isSelected,
  isHovered,
  cabinOffset,
}: InteriorAnchorProps) {
  const anchorPos = useMemo(() => new THREE.Vector3(), [])

  // Position annotation at the target's lookAt point plus cabin offset
  anchorPos.set(
    target.lookAt[0] + cabinOffset.x,
    target.lookAt[1] + cabinOffset.y + 0.15,
    target.lookAt[2] + cabinOffset.z
  )

  // Determine visibility window
  const vis = ANNOTATION_VISIBILITY[target.id] || { showAt: 0.45, hideAt: 0.90 }
  const isVisible =
    isSelected ||
    isHovered ||
    (progress >= vis.showAt && progress <= vis.hideAt)

  if (!isVisible) return null

  // Calculate opacity based on proximity to show/hide boundaries
  let opacity = 1.0
  if (!isSelected && !isHovered) {
    const fadeIn = Math.min((progress - vis.showAt) / 0.06, 1.0)
    const fadeOut = Math.min((vis.hideAt - progress) / 0.06, 1.0)
    opacity = Math.min(fadeIn, fadeOut)
  }

  return (
    <group position={anchorPos}>
      <Html
        center
        distanceFactor={10}
        zIndexRange={[100, 0]}
        className="interior-html-wrapper"
      >
        <div
          className={`interior-callout ${isSelected ? 'is-selected' : ''} ${
            isHovered ? 'is-hovered' : ''
          }`}
          style={{
            opacity: Math.max(opacity, 0),
            pointerEvents: progress > 0.45 ? 'auto' : 'none',
          }}
          onMouseEnter={() => setInteriorHovered(target.id)}
          onMouseLeave={() => setInteriorHovered(null)}
          onClick={(e) => {
            e.stopPropagation()
            selectInteriorTarget(target.id)
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              selectInteriorTarget(target.id)
            }
          }}
          aria-label={`${target.label} — ${target.system}`}
          data-cursor="view"
          data-cursor-label={`INSPECT // ${target.label}`}
        >
          <div className="interior-reticle" />
          <div className="interior-leader" />
          <div className="interior-card">
            <span className="interior-card-system">{target.system}</span>
            <h4 className="interior-card-label">{target.label}</h4>
            {(isSelected || isHovered) && (
              <p className="interior-card-desc">{target.description}</p>
            )}
          </div>
        </div>
      </Html>
    </group>
  )
}

export function InteriorAnnotations() {
  const [storeState, setStoreState] = useState(() => getInteriorState())
  const quality = useMemo(() => getQualityConfig(), [])
  const cabinOffset = useMemo(() => new THREE.Vector3(...CABIN_ORIGIN_OFFSET), [])

  useEffect(() => {
    return subscribeToInteriorStore((newState) => {
      setStoreState({ ...newState })
    })
  }, [])

  // Don't render annotations on LOW quality (mobile)
  if (quality.tier === 'LOW') return null

  return (
    <group name="INTERIOR_SPATIAL_ANNOTATIONS">
      {INTERIOR_TARGETS.map((target) => (
        <InteriorAnchor
          key={target.id}
          target={target}
          progress={storeState.progress}
          isSelected={storeState.selectedTargetId === target.id}
          isHovered={storeState.hoveredTargetId === target.id}
          cabinOffset={cabinOffset}
        />
      ))}
    </group>
  )
}
