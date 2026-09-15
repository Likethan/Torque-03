import './TechnicalLabel.css'

export interface TechnicalLabelData {
  id: string
  code: string
  title: string
  spec: string
  description: string
  target: { x: number; y: number }
  labelPos: { x: number; y: number }
  frameRange: [number, number]
}

export const TECHNICAL_LABELS: TechnicalLabelData[] = [
  {
    id: '2003',
    code: 'HIST-03 // ERA',
    title: '2003',
    spec: 'CM-Series Inception',
    description: 'The benchmark model year that redefined expectations for mid-size engineering discipline.',
    target: { x: 38, y: 54 },
    labelPos: { x: 10, y: 22 },
    frameRange: [20, 60],
  },
  {
    id: 'powertrain',
    code: 'ENG-J30A4 // PROPULSION',
    title: 'POWERTRAIN',
    spec: '3.0L VTEC V6 · 240 HP',
    description: 'Linear power delivery across the rev range with variable valve timing and electronic lift control.',
    target: { x: 22, y: 67 },
    labelPos: { x: 6, y: 68 },
    frameRange: [30, 75],
  },
  {
    id: 'body',
    code: 'AERO-0.30 // EXTERIOR',
    title: 'BODY',
    spec: '0.30 Cd Aerodynamic Wedge',
    description: 'Continuous shoulder crease runs from front wheel arch to rear decklid, suppressing drag and high-speed turbulence.',
    target: { x: 62, y: 46 },
    labelPos: { x: 44, y: 16 },
    frameRange: [45, 85],
  },
  {
    id: 'platform',
    code: 'GEO-106.9 // SUSPENSION',
    title: 'PLATFORM',
    spec: '106.9" Wheelbase · Double-Wishbone',
    description: 'Rigid front subframe with double-wishbone suspension geometry engineered for neutral steering composure.',
    target: { x: 52, y: 73 },
    labelPos: { x: 55, y: 80 },
    frameRange: [50, 90],
  },
  {
    id: '7th-gen',
    code: 'SPEC-07 // CHASSIS',
    title: '7TH GENERATION',
    spec: '48% High-Tensile Steel',
    description: 'Monocoque unit-body architecture delivering class-leading torsional rigidity and five-star crash protection.',
    target: { x: 74, y: 33 },
    labelPos: { x: 74, y: 20 },
    frameRange: [60, 98],
  },
]

interface TechnicalLabelLayerProps {
  currentFrame: number
}

export function TechnicalLabelLayer({ currentFrame }: TechnicalLabelLayerProps) {
  return (
    <div className="tech-labels-layer" aria-label="Technical Annotations">
      <svg
        className="tech-labels-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {TECHNICAL_LABELS.map((item) => {
          const isActive = currentFrame >= item.frameRange[0] && currentFrame <= item.frameRange[1]
          if (!isActive) return null

          const elbowX = item.target.x
          const elbowY = item.labelPos.y + 4

          return (
            <g key={item.id} className="tech-label-connector">
              <circle cx={item.target.x} cy={item.target.y} r="0.8" className="tech-pin-core" />
              <circle cx={item.target.x} cy={item.target.y} r="2.0" className="tech-pin-ring" />
              <polyline
                points={`${item.target.x},${item.target.y} ${elbowX},${elbowY} ${item.labelPos.x + 6},${elbowY}`}
                className="tech-rule-line"
              />
            </g>
          )
        })}
      </svg>

      <div className="tech-labels-container">
        {TECHNICAL_LABELS.map((item) => {
          const isActive = currentFrame >= item.frameRange[0] && currentFrame <= item.frameRange[1]
          if (!isActive) return null

          return (
            <div
              key={item.id}
              className="tech-label-card"
              style={{
                left: `${item.labelPos.x}%`,
                top: `${item.labelPos.y}%`,
              }}
              tabIndex={0}
            >
              <div className="tech-label-top">
                <span className="tech-label-code">{item.code}</span>
                <span className="tech-label-accent-dot" />
              </div>
              <h4 className="tech-label-heading">{item.title}</h4>
              <p className="tech-label-spec">{item.spec}</p>
              <p className="tech-label-desc">{item.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
