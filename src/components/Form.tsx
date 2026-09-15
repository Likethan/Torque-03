import './Form.css'

export interface AnnotationData {
  id: string
  index: string
  title: string
  tag: string
  detail: string
  // Percentages relative to the stage coordinate system
  target: { x: number; y: number }
  labelPos: { x: number; y: number }
  // Scroll progress range when this annotation is in primary focus
  activeRange: [number, number]
}

export const TECHNICAL_ANNOTATIONS: AnnotationData[] = [
  {
    id: 'lighting',
    index: '01',
    title: 'LIGHTING',
    tag: 'Multi-Reflector Quartz',
    detail:
      'Swept triangular crystalline headlamp housings with integrated amber indicators, flush-mounted to reduce turbulence.',
    target: { x: 37, y: 54 },
    labelPos: { x: 8, y: 32 },
    activeRange: [0.42, 0.65],
  },
  {
    id: 'front-arch',
    index: '02',
    title: 'FRONT ARCHITECTURE',
    tag: 'Aerodynamic Wedge & Grille',
    detail:
      'Signature chrome wing grille and integrated bumper apron engineered to smooth airflow and suppress high-speed front lift.',
    target: { x: 22, y: 67 },
    labelPos: { x: 6, y: 72 },
    activeRange: [0.46, 0.70],
  },
  {
    id: 'body-line',
    index: '03',
    title: 'BODY LINE',
    tag: 'Taut Shoulder Crease',
    detail:
      'A continuous architectural character line runs unbroken from the front wheel arch through flush door handles to the rear deck.',
    target: { x: 63, y: 46 },
    labelPos: { x: 44, y: 14 },
    activeRange: [0.55, 0.80],
  },
  {
    id: 'wheelbase',
    index: '04',
    title: 'WHEELBASE & STANCE',
    tag: '106.9" Platform Geometry',
    detail:
      'Extended 2,715 mm wheelbase with 16-inch 5-spoke alloy wheels, paired with double-wishbone suspension for high-speed composure.',
    target: { x: 52, y: 73 },
    labelPos: { x: 56, y: 82 },
    activeRange: [0.62, 0.86],
  },
  {
    id: 'body-gen',
    index: '05',
    title: 'BODY · 7TH GENERATION',
    tag: '0.30 Cd Monocoque Platform',
    detail:
      'Rigid unit-body chassis constructed with 48% high-tensile steel, cutting aerodynamic drag to a class-leading 0.30 Cd.',
    target: { x: 74, y: 33 },
    labelPos: { x: 75, y: 16 },
    activeRange: [0.68, 0.92],
  },
]

export const FORM_DIMENSIONS = [
  { label: 'Wheelbase', value: '106.9', unit: 'in', metric: '2,715 mm' },
  { label: 'Overall Length', value: '189.5', unit: 'in', metric: '4,813 mm' },
  { label: 'Width', value: '71.5', unit: 'in', metric: '1,816 mm' },
  { label: 'Drag Coeff.', value: '0.30', unit: 'Cd', metric: 'Wind tunnel' },
]

interface TechnicalAnnotationsProps {
  progress?: number
  activeId?: string | null
}

export function TechnicalAnnotations({ progress = 0.5, activeId }: TechnicalAnnotationsProps) {
  return (
    <div
      className="tech-annotations-layer"
      data-element="tech-annotations"
      aria-label="Vehicle Technical Annotations"
    >
      {/* SVG Hairlines connecting pins to vehicle features */}
      <svg
        className="tech-annotations-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {TECHNICAL_ANNOTATIONS.map((item) => {
          const isActive =
            activeId === item.id ||
            (progress >= item.activeRange[0] && progress <= item.activeRange[1])
          const opacity = isActive
            ? 1
            : progress > item.activeRange[0] - 0.08 && progress < item.activeRange[1] + 0.08
            ? 0.35
            : 0

          if (opacity === 0) return null

          // Mid-point elbow for clean architectural drafting lines
          const elbowX = item.target.x
          const elbowY = item.labelPos.y + 4

          return (
            <g
              key={item.id}
              className={`annotation-connector ${isActive ? 'annotation-connector--active' : ''}`}
              style={{ opacity }}
            >
              {/* Target pin dot on vehicle */}
              <circle
                cx={item.target.x}
                cy={item.target.y}
                r={isActive ? 1.0 : 0.7}
                className="annotation-pin-dot"
              />
              <circle
                cx={item.target.x}
                cy={item.target.y}
                r={isActive ? 2.2 : 1.4}
                className="annotation-pin-pulse"
              />

              {/* Architectural drafting connector line */}
              <polyline
                points={`${item.target.x},${item.target.y} ${elbowX},${elbowY} ${item.labelPos.x + 6},${elbowY}`}
                className="annotation-line"
              />
            </g>
          )
        })}
      </svg>

      {/* Editorial Annotation Cards */}
      <div className="tech-annotations-cards" aria-live="polite">
        {TECHNICAL_ANNOTATIONS.map((item) => {
          const isActive =
            activeId === item.id ||
            (progress >= item.activeRange[0] && progress <= item.activeRange[1])
          const isVisible =
            progress > item.activeRange[0] - 0.08 && progress < item.activeRange[1] + 0.08

          return (
            <div
              key={item.id}
              id={`annotation-${item.id}`}
              className={`tech-annotation-card ${
                isActive ? 'tech-annotation-card--active' : ''
              } ${isVisible ? 'tech-annotation-card--visible' : ''}`}
              style={{
                left: `${item.labelPos.x}%`,
                top: `${item.labelPos.y}%`,
              }}
              data-element="tech-annotation"
              data-annotation-id={item.id}
              tabIndex={0}
            >
              <div className="tech-annotation-badge">
                <span className="tech-annotation-index">{item.index}</span>
                <span className="tech-annotation-title">{item.title}</span>
              </div>
              <p className="tech-annotation-tag">{item.tag}</p>
              <p className="tech-annotation-detail">{item.detail}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function FormHeader() {
  return (
    <div className="form-header-group" data-element="form-header">
      <span className="type-label form-eyebrow motion-label" tabIndex={0}>
        01 / Exterior Architecture
      </span>
      <h2 className="type-heading-1 form-title">
        Sculpted by Wind and Purpose
      </h2>
      <hr className="divider form-divider" />
      <p className="type-body form-intro-text">
        The seventh-generation Accord departed from conservative three-box sedan
        proportions in favor of an athletic, aerodynamic wedge. Every contour was
        refined to balance high-speed stability with enduring aesthetic restraint.
      </p>
    </div>
  )
}

export function FormDimensions() {
  return (
    <div className="form-dimensions-strip" data-element="form-dimensions">
      {FORM_DIMENSIONS.map((item) => (
        <div key={item.label} className="form-dim-item">
          <span className="form-dim-label">{item.label}</span>
          <div className="form-dim-value-wrap">
            <span className="form-dim-val">{item.value}</span>
            <span className="form-dim-unit">{item.unit}</span>
          </div>
          <span className="form-dim-metric">{item.metric}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * Standalone Form section (accessible fallback and structural reference).
 */
export function Form() {
  return (
    <section id="form" className="section form-section" aria-label="Design and Form">
      <div className="container">
        <FormHeader />
        <div className="form-visual-container">
          <img
            src="/images/accord-hero.jpg"
            alt="2003 Honda Accord sedan exterior architecture"
            className="form-fallback-img"
            loading="lazy"
          />
          <TechnicalAnnotations progress={0.65} />
        </div>
        <FormDimensions />
      </div>
    </section>
  )
}
