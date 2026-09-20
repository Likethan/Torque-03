import { useEffect, useRef } from 'react'
import { setActiveInteraction } from '../../interaction/interactionStore'
import { prefersReducedMotion } from '../../animation/gsapConfig'
import './VehicleHoverZones.css'

export interface HoverZoneData {
  id: string
  label: string
  spec: string
  left: string
  top: string
  width: string
  height: string
}

const VEHICLE_ZONES: readonly HoverZoneData[] = [
  {
    id: 'HEADLIGHT',
    label: 'HEADLIGHT OPTIC',
    spec: 'AERODYNAMIC POLYCARBONATE // HIGH-INTENSITY DUAL BEAM',
    left: '58%',
    top: '46%',
    width: '14%',
    height: '14%',
  },
  {
    id: 'GRILLE',
    label: 'AERO COWL & GRILLE',
    spec: 'CHROME CHEVRON INTAKE // 0.30 Cd DRAG REDUCTION',
    left: '70%',
    top: '52%',
    width: '12%',
    height: '12%',
  },
  {
    id: 'ENGINE',
    label: 'J30A4 V6 VTEC POWERTRAIN',
    spec: '3.0L 60° V6 // 240 HP @ 6250 RPM // SOHC 24V',
    left: '42%',
    top: '36%',
    width: '26%',
    height: '18%',
  },
  {
    id: 'WHEEL',
    label: 'ALLOY & DOUBLE-WISHBONE',
    spec: '16" 7-SPOKE ALLOY // INDEPENDENT GEOMETRY',
    left: '36%',
    top: '58%',
    width: '16%',
    height: '24%',
  },
  {
    id: 'FLANK',
    label: 'MONOCOQUE CHASSIS FLANK',
    spec: 'HIGH-TENSILE STEEL UNIBODY // TORSIONAL RIGIDITY +27%',
    left: '16%',
    top: '44%',
    width: '24%',
    height: '22%',
  },
  {
    id: 'GREENHOUSE',
    label: 'CABIN GREENHOUSE',
    spec: 'FLUSH PILLARS // ACOUSTIC INSULATING GLASS',
    left: '22%',
    top: '25%',
    width: '30%',
    height: '20%',
  },
]

export function VehicleHoverZones() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      // Ensure interaction label resets on unmount
      setActiveInteraction('NONE', 0, 0)
    }
  }, [])

  const handleMouseEnter = (zone: HoverZoneData) => {
    if (prefersReducedMotion()) return
    setActiveInteraction(`INSPECT // ${zone.label}`, 1.0, 0.4)
  }

  const handleMouseLeave = () => {
    setActiveInteraction('NONE', 0, 0)
  }

  return (
    <div
      ref={containerRef}
      className="vehicle-hover-zones-layer"
      aria-label="Interactive Component Inspection Zones"
    >
      {VEHICLE_ZONES.map((zone) => (
        <button
          key={zone.id}
          type="button"
          className="vehicle-hover-zone-target"
          data-cursor="view"
          data-cursor-label={`INSPECT // ${zone.id}`}
          style={{
            left: zone.left,
            top: zone.top,
            width: zone.width,
            height: zone.height,
          }}
          onMouseEnter={() => handleMouseEnter(zone)}
          onMouseLeave={handleMouseLeave}
          onFocus={() => handleMouseEnter(zone)}
          onBlur={handleMouseLeave}
          aria-label={`${zone.label}: ${zone.spec}`}
          title={`${zone.label} — ${zone.spec}`}
        >
          <span className="vehicle-hover-zone-reticle">
            <span className="zone-corner zone-corner--tl" />
            <span className="zone-corner zone-corner--br" />
            <span className="zone-dot" />
          </span>
          <span className="vehicle-hover-zone-badge" aria-hidden="true">
            <span className="zone-badge-id">{zone.id}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
