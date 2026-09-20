import React, { useEffect, useCallback } from 'react'
import {
  useVehicleState,
  selectDetailStudy,
  setHeadlightState,
  setTaillightState,
  DETAIL_STUDIES,
  ORDERED_STUDY_IDS,
  VEHICLE_REGISTRY,
  type HeadlightState,
  type TaillightState,
} from '../../three/vehicle'
import { Accord3DCanvas } from '../../three/Accord3DCanvas'
import './AutomotiveDetailStage.css'

/**
 * ----------------------------------------------------------------------------
 * AUTOMOTIVE DETAIL STAGE (Step 13 — Advanced Automotive Detail Systems)
 * ----------------------------------------------------------------------------
 * Interactive automotive engineering inspection suite for the 2003 Honda Accord.
 *
 * Implements:
 * - 9 authored close-up camera studies (fascia, headlights, wheels, brakes, bodyline, etc.)
 * - Dynamic lighting controllers (headlights & taillights)
 * - Kinetic typography with real mechanical & aerodynamic specifications
 * - Reversible navigation preserving authoritative scroll position
 * - Keyboard navigation (Esc to return, Arrow keys / Tabs to navigate)
 */
export const AutomotiveDetailStage: React.FC = () => {
  const vehicleState = useVehicleState()
  const activeStudyId = vehicleState.activeDetailStudy
  const activeStudy = activeStudyId ? DETAIL_STUDIES[activeStudyId] : null
  const activeComponent = activeStudy ? VEHICLE_REGISTRY[activeStudy.primaryComponent] : null

  // Keyboard accessibility: Escape exits detail study smoothly
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeStudyId) {
        selectDetailStudy(null)
      }
    },
    [activeStudyId]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <section
      id="automotive-detail-stage"
      className="detail-stage-root"
      aria-label="Automotive Detail Inspection"
    >
      <div className="detail-stage-content">
        {/* Header & Identification */}
        <header className="detail-stage-header">
          <span className="detail-stage-tag">
            PHASE 13 // ADVANCED AUTOMOTIVE DETAIL SYSTEMS
          </span>
          <h2 className="detail-stage-title">PHYSICAL PRESENCE ARCHIVE</h2>
          <p className="detail-stage-subtitle">
            Micro-inspection of the 2003 Honda Accord monocoque architecture.
            Photographed under calibrated studio softbox arrays, high-resolution rim illumination,
            and authentic material physics.
          </p>
        </header>

        {/* 9 Authored Detail Studies Navigation */}
        <nav
          className="detail-nav-container"
          aria-label="Detail Studies Selector"
          role="tablist"
        >
          {ORDERED_STUDY_IDS.map((studyId) => {
            const study = DETAIL_STUDIES[studyId]
            const isActive = activeStudyId === studyId

            return (
              <button
                key={studyId}
                role="tab"
                aria-selected={isActive}
                className={`detail-nav-button ${isActive ? 'active' : ''}`}
                onClick={() => selectDetailStudy(isActive ? null : studyId)}
              >
                <span className="detail-nav-idx">{study.index}</span>
                <span className="detail-nav-name">{study.title}</span>
              </button>
            )
          })}
        </nav>

        {/* 3D Automotive Studio Viewport for Close-Up Inspection */}
        <div className="detail-viewport-container" aria-label="3D Vehicle Detail Inspection Viewport">
          <Accord3DCanvas interactive showHUD={false} />
          {activeStudy && (
            <div className="detail-viewport-overlay">
              <span className="detail-viewport-tag">MACRO CAMERA STUDY // {activeStudy.index}</span>
              <span className="detail-viewport-target">{activeStudy.title}</span>
            </div>
          )}
        </div>

        {/* Active Study Technical Inspector Card */}
        {activeStudy && activeComponent ? (
          <div className="detail-inspector-card" role="region" aria-live="polite">
            <div className="detail-inspector-main">
              <div className="detail-meta-badge">
                <span>COMPONENT REF:</span>
                <strong>{activeComponent.id}</strong>
              </div>

              <h3 className="detail-card-title">{activeStudy.title}</h3>
              <span className="detail-card-subtitle">{activeStudy.subtitle}</span>

              <p className="detail-card-description">{activeStudy.description}</p>

              {/* Technical Specifications Grid */}
              <div className="detail-spec-grid">
                <div className="detail-spec-item">
                  <span className="detail-spec-label">SYSTEM CLASSIFICATION</span>
                  <span className="detail-spec-value">{activeComponent.category}</span>
                </div>
                <div className="detail-spec-item">
                  <span className="detail-spec-label">ARCHIVE CODE</span>
                  <span className="detail-spec-value">{activeComponent.code}</span>
                </div>
                <div className="detail-spec-item">
                  <span className="detail-spec-label">ENGINEERING SPECIFICATION</span>
                  <span className="detail-spec-value">{activeComponent.spec}</span>
                </div>
                <div className="detail-spec-item">
                  <span className="detail-spec-label">PBR MATERIAL PIPELINE</span>
                  <span className="detail-spec-value">{activeComponent.materialToken}</span>
                </div>
              </div>
            </div>

            {/* Interactive Systems Sidebar */}
            <aside className="detail-sidebar-controls">
              {/* Headlight Lighting Control */}
              <div className="detail-control-block">
                <span className="detail-control-heading">HEADLIGHT SUBSYSTEM</span>
                <div className="detail-button-group">
                  {(['OFF', 'IDLE', 'ACTIVE', 'CINEMATIC'] as HeadlightState[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={`detail-sub-btn ${
                        vehicleState.lighting.headlightState === st ? 'active' : ''
                      }`}
                      onClick={() => setHeadlightState(st)}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Taillight Lighting Control */}
              <div className="detail-control-block">
                <span className="detail-control-heading">TAILLIGHT SUBSYSTEM</span>
                <div className="detail-button-group">
                  {(['OFF', 'ACTIVE', 'CINEMATIC'] as TaillightState[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={`detail-sub-btn ${
                        vehicleState.lighting.taillightState === st ? 'active' : ''
                      }`}
                      onClick={() => setTaillightState(st)}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exit Detail Study (Reversible transition) */}
              <button
                type="button"
                className="detail-exit-button"
                onClick={() => selectDetailStudy(null)}
                aria-label="Return to full vehicle overview"
              >
                <span>← RETURN TO OVERVIEW</span>
                <kbd style={{ fontSize: '0.65rem', opacity: 0.6, padding: '2px 4px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '2px' }}>
                  ESC
                </kbd>
              </button>
            </aside>
          </div>
        ) : (
          /* Default Idle Overview State */
          <div
            className="detail-inspector-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.6rem 2rem',
              background: 'rgba(10, 14, 20, 0.65)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: '#00d4ff', letterSpacing: '0.12em', fontWeight: 700 }}>
                HOTSPOT EXPLORATION ACTIVE
              </span>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.88rem', color: '#94a3b8' }}>
                Select a detail study above or click on any spatial 3D crosshair reticle on the vehicle to glide the camera into close-up macro analysis.
              </p>
            </div>
            <button
              type="button"
              className="detail-sub-btn active"
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.75rem' }}
              onClick={() => selectDetailStudy('HEADLIGHT_STUDY')}
            >
              BEGIN DETAIL TOUR →
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
