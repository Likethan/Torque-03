import React, { useState, useEffect } from 'react'
import type { WeatherStateId } from './environmentTypes'
import { WEATHER_PRESETS } from './weatherPresets'
import {
  getEnvironmentState,
  setWeatherDebugOverride,
  setWeatherDebugProperty,
  isWeatherDebugActive,
} from './environmentStore'

/**
 * ----------------------------------------------------------------------------
 * WEATHER DEBUG OVERLAY (Step 12 — Environmental Interaction & Weather)
 * ----------------------------------------------------------------------------
 * Development-only HUD for testing cinematic weather presets and continuous
 * environmental parameters (rain, fog, wind, wetness).
 *
 * Disabled in production unless ?weatherDebug=true query param is present.
 * Toggle visibility with the backquote / tilde key (`~`).
 */
export const WeatherDebugOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [activePreset, setActivePreset] = useState<WeatherStateId | 'AUTO'>('AUTO')
  const [rainVal, setRainVal] = useState(0)
  const [wetnessVal, setWetnessVal] = useState(0)
  const [fogVal, setFogVal] = useState(0.012)
  const [windVal, setWindVal] = useState(0.15)

  // Only enable in development or when explicitly requested via URL param
  const isEnabled =
    typeof window !== 'undefined' &&
    (window.location.search.includes('debug=true') ||
      window.location.search.includes('weatherDebug=true') ||
      import.meta.env.DEV)

  useEffect(() => {
    if (!isEnabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        setIsOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEnabled])

  // Sync slider positions periodically when panel is open
  useEffect(() => {
    if (!isOpen) return
    const interval = setInterval(() => {
      const env = getEnvironmentState()
      setRainVal(env.rainIntensity)
      setWetnessVal(env.roadWetness)
      setFogVal(env.fogIntensity)
      setWindVal(env.windIntensity)
      if (!isWeatherDebugActive()) {
        setActivePreset('AUTO')
      }
    }, 200)
    return () => clearInterval(interval)
  }, [isOpen])

  if (!isEnabled) return null

  const handleSelectPreset = (presetId: WeatherStateId | 'AUTO') => {
    setActivePreset(presetId)
    if (presetId === 'AUTO') {
      setWeatherDebugOverride(null)
    } else {
      setWeatherDebugOverride(presetId)
      const p = WEATHER_PRESETS[presetId]
      setRainVal(p.rainIntensity)
      setWetnessVal(p.roadWetness)
      setFogVal(p.fogIntensity)
      setWindVal(p.windIntensity)
    }
  }

  const handleRainChange = (val: number) => {
    setRainVal(val)
    setWeatherDebugProperty({ rainIntensity: val })
  }

  const handleWetnessChange = (val: number) => {
    setWetnessVal(val)
    setWeatherDebugProperty({ roadWetness: val })
  }

  const handleFogChange = (val: number) => {
    setFogVal(val)
    setWeatherDebugProperty({ fogIntensity: val })
  }

  const handleWindChange = (val: number) => {
    setWindVal(val)
    setWeatherDebugProperty({ windIntensity: val })
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '11px',
        pointerEvents: 'auto',
      }}
    >
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          background: isOpen ? 'rgba(0, 212, 255, 0.2)' : 'rgba(10, 14, 20, 0.75)',
          border: '1px solid rgba(0, 212, 255, 0.4)',
          color: '#00d4ff',
          borderRadius: '4px',
          padding: '6px 10px',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '8px',
          float: 'right',
        }}
        title="Toggle Weather Debug HUD (Hotkey: ~)"
      >
        {isOpen ? '✕ Close Weather HUD' : '☁ Weather HUD (~)'}
      </button>

      {/* Expanded Control Box */}
      {isOpen && (
        <div
          style={{
            clear: 'both',
            background: 'rgba(8, 12, 18, 0.92)',
            border: '1px solid rgba(0, 212, 255, 0.35)',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65)',
            borderRadius: '6px',
            padding: '16px',
            color: '#c2cad6',
            width: '280px',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div
            style={{
              color: '#00d4ff',
              fontWeight: 'bold',
              letterSpacing: '0.1em',
              marginBottom: '12px',
              borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
              paddingBottom: '6px',
            }}
          >
            WEATHER SYSTEM DEBUG [STEP 12]
          </div>

          {/* Preset Buttons */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ color: '#8a99ad', marginBottom: '6px', fontSize: '10px' }}>
              AUTHORED PRESETS:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
              {(['AUTO', 'CLEAR', 'OVERCAST', 'MIST', 'RAIN', 'BLUE_HOUR'] as const).map(
                (presetKey) => (
                  <button
                    key={presetKey}
                    onClick={() => handleSelectPreset(presetKey)}
                    style={{
                      background:
                        activePreset === presetKey
                          ? '#00d4ff'
                          : 'rgba(255, 255, 255, 0.06)',
                      color: activePreset === presetKey ? '#0a0e14' : '#e0e6ed',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '3px',
                      padding: '5px 4px',
                      fontSize: '9px',
                      fontWeight: activePreset === presetKey ? 'bold' : 'normal',
                      cursor: 'pointer',
                    }}
                  >
                    {presetKey}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Parameter Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>RAIN INTENSITY</span>
                <span style={{ color: '#00d4ff' }}>{rainVal.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={rainVal}
                onChange={(e) => handleRainChange(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#00d4ff' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>ROAD WETNESS</span>
                <span style={{ color: '#00d4ff' }}>{wetnessVal.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.02"
                value={wetnessVal}
                onChange={(e) => handleWetnessChange(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#00d4ff' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>FOG DENSITY</span>
                <span style={{ color: '#00d4ff' }}>{fogVal.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0.005"
                max="0.05"
                step="0.001"
                value={fogVal}
                onChange={(e) => handleFogChange(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#00d4ff' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>WIND SPEED</span>
                <span style={{ color: '#00d4ff' }}>{windVal.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.02"
                value={windVal}
                onChange={(e) => handleWindChange(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#00d4ff' }}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: '12px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '9px',
              color: '#657385',
              lineHeight: '1.4',
            }}
          >
            * AUTO returns control to scroll-driven road progression [0.0 - 1.0].
          </div>
        </div>
      )}
    </div>
  )
}
