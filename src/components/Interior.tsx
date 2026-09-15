import './Interior.css'

const features = [
  'Dual-zone automatic climate control with precision temperature management',
  'Leather-trimmed steering wheel with integrated audio and cruise controls',
  'Power driver\'s seat with adjustable lumbar and memory positions',
  '8-speaker premium audio system with 6-disc in-dash CD changer',
  'Genuine wood-grain accents with a warm, architectural interior palette',
  'Illuminated power window switches and backlit instrument cluster',
]

export function Interior() {
  return (
    <section id="interior" className="section interior" aria-label="Interior">
      <div className="container">
        <div className="interior__layout">
          <div className="interior__media motion-media-hover">
            <img
              src="/images/accord-interior.jpg"
              alt="2003 Honda Accord interior showing dashboard, steering wheel, and center console"
              loading="lazy"
            />
          </div>

          <div className="interior__content">
            <span className="type-label motion-label" tabIndex={0}>
              Cabin Architecture
            </span>
            <h2 className="type-heading-1">
              Considered Space
            </h2>
            <hr className="divider" />
            <p className="type-body interior__text">
              Every surface, control, and sight line inside the seventh-generation 
              Accord was designed to serve a purpose. The cabin balances material 
              quality with ergonomic precision — placing every switch and gauge 
              where the driver expects it to be.
            </p>

            <div className="interior__features">
              {features.map((feature, i) => (
                <div key={i} className="interior__feature">
                  <span className="interior__feature-marker" aria-hidden="true" />
                  <p className="interior__feature-text">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
