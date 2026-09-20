import React, { useRef, useState } from 'react'
import type * as THREE from 'three'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { DETAIL_HOTSPOTS } from './vehicleRegistry'
import {
  selectDetailStudy,
  setVehicleComponentHovered,
} from './vehicleStore'
import { prefersReducedMotion } from '../../animation/gsapConfig'
import { getMotionBridgeState } from '../motionBridge'

/**
 * ----------------------------------------------------------------------------
 * VEHICLE DETAIL HOTSPOTS (Step 13 — Advanced Automotive Detail Systems)
 * ----------------------------------------------------------------------------
 * Minimalist 3D spatial technical indicators anchored to actual components.
 *
 * Implements Requirements 32, 33, 34:
 * - Subtle cursor response, small technical reticles, and leader lines.
 * - No game markers, large glowing buttons, or floating badges.
 * - Selecting a hotspot smoothly glides the camera into the component study.
 * - Automatically fades out during macro close-up view or road driving.
 */
export const VehicleDetailHotspots: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    const group = groupRef.current
    if (!group) return

    const motion = getMotionBridgeState()

    // Hide hotspots during high-speed road driving, interior cabin mode, or exploded view
    const isDriving = motion.roadProgress > 0.05
    const isInside = motion.interiorProgress > 0.25
    const isExploded = motion.explodedProgress > 0.15

    group.visible = !isDriving && !isInside && !isExploded
  })

  const handleSelect = (studyId: any, compId: any) => {
    selectDetailStudy(studyId)
    setVehicleComponentHovered(compId)
  }

  const handleHover = (compId: any, isHover: boolean) => {
    if (prefersReducedMotion()) return
    setHoveredId(isHover ? compId : null)
    setVehicleComponentHovered(isHover ? compId : null)
  }

  return (
    <group ref={groupRef} name="VEHICLE_DETAIL_HOTSPOTS">
      {DETAIL_HOTSPOTS.map((hotspot) => {
        const isHovered = hoveredId === hotspot.componentId

        return (
          <group key={hotspot.id} position={hotspot.worldPosition}>
            <Html
              center
              distanceFactor={8}
              zIndexRange={[100, 0]}
              style={{
                pointerEvents: 'auto',
                transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: isHovered ? 'scale(1.08)' : 'scale(1.0)',
              }}
            >
              <button
                type="button"
                onClick={() => handleSelect(hotspot.studyId, hotspot.componentId)}
                onMouseEnter={() => handleHover(hotspot.componentId, true)}
                onMouseLeave={() => handleHover(hotspot.componentId, false)}
                onFocus={() => handleHover(hotspot.componentId, true)}
                onBlur={() => handleHover(hotspot.componentId, false)}
                aria-label={`Inspect detail: ${hotspot.label}`}
                title={`${hotspot.label} — ${hotspot.shortSpec}`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  outline: 'none',
                }}
              >
                {/* Precision CAD Crosshair Reticle */}
                <div
                  style={{
                    position: 'relative',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: isHovered ? '#00d4ff' : 'rgba(255, 255, 255, 0.85)',
                      boxShadow: isHovered ? '0 0 10px #00d4ff' : 'none',
                      transition: 'background 0.2s, box-shadow 0.2s',
                    }}
                  />
                  {/* Subtle Technical Bracket Ring */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      border: isHovered
                        ? '1px solid rgba(0, 212, 255, 0.8)'
                        : '1px solid rgba(255, 255, 255, 0.25)',
                      borderRadius: '50%',
                      transform: isHovered ? 'scale(1.15)' : 'scale(0.85)',
                      transition: 'all 0.25s ease-out',
                    }}
                  />
                </div>

                {/* Technical Label & Leader Tag */}
                <div
                  style={{
                    display: isHovered ? 'flex' : 'none',
                    flexDirection: 'column',
                    background: 'rgba(10, 14, 20, 0.92)',
                    border: '1px solid rgba(0, 212, 255, 0.35)',
                    padding: '3px 6px',
                    borderRadius: '2px',
                    fontFamily: "'JetBrains Mono', monospace",
                    whiteSpace: 'nowrap',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      color: '#00d4ff',
                      textTransform: 'uppercase',
                    }}
                  >
                    {hotspot.label}
                  </span>
                  <span
                    style={{
                      fontSize: '7.5px',
                      color: '#8a99ad',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {hotspot.shortSpec}
                  </span>
                </div>
              </button>
            </Html>
          </group>
        )
      })}
    </group>
  )
}
