import './Legacy.css'

export function Legacy() {
  return (
    <section id="legacy" className="section legacy" aria-label="Legacy">
      <div className="container">
        <div className="legacy__content">
          <span className="type-label legacy__label motion-label" tabIndex={0}>
            Heritage
          </span>
          <h2 className="type-heading-1 legacy__title">
            An Enduring Standard
          </h2>
          <hr className="divider" />
          <p className="type-body legacy__text">
            The 2003 Accord arrived as the culmination of three decades of 
            continuous refinement. First introduced in 1976 as a compact 
            hatchback, each successive generation elevated the nameplate — 
            growing not just in size but in ambition and engineering depth.
          </p>
          <p className="type-body legacy__text">
            By its seventh generation, the Accord had become the most 
            awarded car in America. It was not merely a bestseller. It was 
            the car that automotive journalists, engineers, and consumers 
            consistently returned to as the reference point for what a 
            sedan should be.
          </p>
          <p className="type-body legacy__text">
            That legacy is built on a simple principle: do every single thing 
            well. Not flashy engineering. Not gratuitous technology. Precision, 
            balance, and respect for the people who drive it.
          </p>

          <div className="legacy__cta">
            <a href="#specifications" className="btn motion-button">
              <span>Explore Specifications</span>
              <span className="btn__arrow" aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
