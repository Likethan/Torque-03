import { useState, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import {
  ENGINEERING_COMPONENTS,
  computeExplosionOffset,
  type EngineeringComponentConfig,
} from './explodedComponents'
import {
  getExplodedState,
  selectExplodedComponent,
  setExplodedHovered,
  subscribeToExplodedStore,
} from './explodedStore'
import { getQualityConfig } from '../qualityTiers'
import './ExplodedAnnotations.css'

/**
 * ----------------------------------------------------------------------------
 * SPATIAL 3D TECHNICAL ANNOTATIONS (Step 9 — Exploded View)
 * ----------------------------------------------------------------------------
 * Spatial annotations with thin editorial leader lines anchored directly to the
 * 3D positions of the separating engineering components.
 *
 * Features:
 * - Tracks 3D component coordinates in real time as the assembly explodes
 * - Progressively reveals technical callouts based on engineeringProgress
 * - Features authentic 2003 Honda Accord engineering specifications
 * - Fully keyboard accessible and touch-friendly
 */

interface ComponentAnchorProps {
  config: EngineeringComponentConfig
  progress: number
  isSelected: boolean
  isHovered: boolean
  isMobile: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

function ComponentAnchor({
  config,
  progress,
  isSelected,
  isHovered,
  isMobile,
  onSelect,
  onHover,
}: ComponentAnchorProps) {
  const currentPos = useMemo(() => new THREE.Vector3(), [])
  const offset = useMemo(() => new THREE.Vector3(), [])

  // Calculate live 3D anchor position
  computeExplosionOffset(config, progress, isMobile ? 0.65 : 1.0, offset)
  currentPos.set(...config.nominalPosition).add(offset)

  // Subtle vertical offset for the callout card
  const isElevated = config.nominalPosition[1] > 0.4
  const leaderDirection = isElevated ? 'up' : 'down'

  // Visibility threshold: show when exploded enough or explicitly selected
  const isVisible = progress > 0.42 || isSelected || isHovered

  if (!isVisible) return null

  // Opacity fade based on explosion progress
  const opacity = Math.min((progress - 0.38) / 0.25, 1.0)

  return (
    <group position={currentPos}>
      <Html
        center
        distanceFactor={12}
        zIndexRange={[100, 0]}
        className="exploded-html-wrapper"
      >
        <div
          className={`exploded-callout-node ${isSelected ? 'is-selected' : ''} ${
            isHovered ? 'is-hovered' : ''
          } leader-${leaderDirection}`}
          style={{
            opacity: isSelected || isHovered ? 1.0 : opacity,
            pointerEvents: progress > 0.45 ? 'auto' : 'none',
          }}
          onMouseEnter={() => onHover(config.id)}
          onMouseLeave={() => onHover(null)}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(config.id)
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelect(config.id)
            }
          }}
          aria-label={`${config.label} — ${config.system}`}
          data-cursor="view"
          data-cursor-label={`INSPECT // ${config.label}`}
        >
          {/* Central 3D Reticle Point */}
          <div className="exploded-reticle-dot" />

          {/* Technical Metadata Card and Leader Line appear ONLY on hover or selection */}
          {(isSelected || isHovered) && (
            <>
              <div className="exploded-leader-line" />
              <div className="exploded-callout-card">
                <div className="exploded-callout-header">
                  <span className="exploded-callout-category">
                    {config.category} // {config.system}
                  </span>
                  <span className="exploded-callout-id">SPEC 0{config.priority}</span>
                </div>
                <h4 className="exploded-callout-title">{config.label}</h4>

                <div className="exploded-callout-expanded">
                  <p className="exploded-callout-desc">{config.description}</p>
                  <div className="exploded-callout-specs">
                    {config.specs.map((spec) => (
                      <div key={spec.label} className="exploded-spec-row">
                        <span className="exploded-spec-label">{spec.label}:</span>
                        <span className="exploded-spec-val">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Html>
    </group>
  )
}

export function ExplodedAnnotations() {
  const [storeState, setStoreState] = useState(() => getExplodedState())
  const quality = useMemo(() => getQualityConfig(), [])
  const isMobile = quality.tier === 'LOW'

  useEffect(() => {
    return subscribeToExplodedStore((newState) => {
      setStoreState({ ...newState })
    })
  }, [])

  const handleSelect = (id: string) => {
    selectExplodedComponent(id)
  }

  const handleHover = (id: string | null) => {
    setExplodedHovered(id)
  }

  return (
    <group name="EXPLODED_SPATIAL_ANNOTATIONS">
      {ENGINEERING_COMPONENTS.map((config) => (
        <ComponentAnchor
          key={config.id}
          config={config}
          progress={storeState.progress}
          isSelected={storeState.selectedId === config.id}
          isHovered={storeState.hoveredId === config.id}
          isMobile={isMobile}
          onSelect={handleSelect}
          onHover={handleHover}
        />
      ))}
    </group>
  )
}
