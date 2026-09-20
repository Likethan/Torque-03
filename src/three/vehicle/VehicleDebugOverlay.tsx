import React, { useState } from 'react'
import { useVehicleState, selectDetailStudy } from './vehicleStore'
import { ORDERED_STUDY_IDS, DETAIL_STUDIES } from './detailStudies'
import type { DetailStudyId } from './vehicleTypes'

/**
 * ----------------------------------------------------------------------------
 * VEHICLE DEBUG OVERLAY (Step 13 — Requirement 43)
 * ----------------------------------------------------------------------------
 * Development-only diagnostic HUD for verifying vehicle detail systems:
 * - Active camera study & blend factor
 * - Live wheel speed and steering telemetry
 * - Dynamic headlight & taillight states
 * - Material & environmental response
 *
 * Automatically stripped in production (only activates when ?detailDebug=true
 * or in Vite dev mode when toggled).
 */
export const VehicleDebugOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const vehicle = useVehicleState()

  // Only render if debug flag is present or in development mode
  const isDebugUrl =
    typeof window !== 'undefined' &&
    (window.location.search.includes('debug=true') ||
      window.location.search.includes('detailDebug=true') ||
      window.location.search.includes('weatherDebug=true'))

  if (!isDebugUrl && import.meta.env.PROD) {
    return null
  }

  return (
    <aside
      aria-label="Automotive Detail Debug"
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '16px',
        zIndex: 9999,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        color: '#e2e8f0',
      }}
    >
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            background: 'rgba(10, 14, 20, 0.88)',
            border: '1px solid rgba(0, 212, 255, 0.4)',
            color: '#00d4ff',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          ⚙ DETAIL HUD
        </button>
      ) : (
        <div
          style={{
            width: '320px',
            background: 'rgba(10, 14, 20, 0.94)',
            border: '1px solid rgba(0, 212, 255, 0.35)',
            borderRadius: '6px',
            padding: '14px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: '6px',
            }}
          >
            <span style={{ color: '#00d4ff', fontWeight: 700, letterSpacing: '0.08em' }}>
              VEHICLE DETAIL TELEMETRY
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <div>
              <span style={{ color: '#64748b' }}>STUDY: </span>
              <span style={{ color: vehicle.activeDetailStudy ? '#38bdf8' : '#94a3b8' }}>
                {vehicle.activeDetailStudy ?? 'NONE (SCROLL)'}
              </span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>BLEND: </span>
              <span style={{ color: '#f1f5f9' }}>{(vehicle.detailBlend * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>HEADLIGHT: </span>
              <span style={{ color: '#facc15' }}>{vehicle.lighting.headlightState}</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>TAILLIGHT: </span>
              <span style={{ color: '#f87171' }}>{vehicle.lighting.taillightState}</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>SPEED: </span>
              <span style={{ color: '#4ade80' }}>{vehicle.wheelSpeedKmh.toFixed(1)} km/h</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>STEER: </span>
              <span style={{ color: '#4ade80' }}>{(vehicle.wheelSteerAngle * (180 / Math.PI)).toFixed(1)}°</span>
            </div>
          </div>

          {/* Quick Study Switcher */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
            <span style={{ color: '#94a3b8', fontSize: '10px' }}>QUICK STUDY SWITCH:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              <button
                type="button"
                onClick={() => selectDetailStudy(null)}
                style={{
                  background: vehicle.activeDetailStudy === null ? '#00d4ff' : 'rgba(255,255,255,0.06)',
                  color: vehicle.activeDetailStudy === null ? '#000' : '#cbd5e1',
                  border: 'none',
                  padding: '3px 6px',
                  borderRadius: '2px',
                  fontSize: '9px',
                  cursor: 'pointer',
                }}
              >
                OVERVIEW
              </button>
              {ORDERED_STUDY_IDS.map((id: DetailStudyId) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectDetailStudy(id)}
                  style={{
                    background: vehicle.activeDetailStudy === id ? '#00d4ff' : 'rgba(255,255,255,0.06)',
                    color: vehicle.activeDetailStudy === id ? '#000' : '#cbd5e1',
                    border: 'none',
                    padding: '3px 6px',
                    borderRadius: '2px',
                    fontSize: '9px',
                    cursor: 'pointer',
                  }}
                >
                  {DETAIL_STUDIES[id].index}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
