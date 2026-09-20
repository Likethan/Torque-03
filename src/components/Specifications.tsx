import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { prefersReducedMotion } from '../animation/gsapConfig'
import './Specifications.css'

gsap.registerPlugin(ScrollTrigger)

const specs = [
  {
    value: '240',
    unit: 'hp',
    label: 'Peak Power',
    description: '3.0L V6 SOHC VTEC at 6,250 rpm',
  },
  {
    value: '212',
    unit: 'lb·ft',
    label: 'Torque',
    description: 'Peak torque at 5,000 rpm',
  },
  {
    value: '2.4L',
    unit: 'i4',
    label: 'Base Engine',
    description: 'i-VTEC inline-four, 160 hp',
  },
  {
    value: '5',
    unit: '★',
    label: 'NHTSA Rating',
    description: 'Five-star frontal crash rating',
  },
  {
    value: '106.9"',
    unit: '',
    label: 'Wheelbase',
    description: 'Extended for improved stability',
  },
  {
    value: '3,230',
    unit: 'lbs',
    label: 'Curb Weight',
    description: 'Sedan with automatic transmission',
  },
]

export function Specifications() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      // 1. Header entrance scrubbed with scroll
      if (headerRef.current) {
        gsap.from(headerRef.current, {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%',
            end: 'top 55%',
            scrub: 0.3,
            id: 'specs-header',
          },
          opacity: 0,
          y: 35,
          ease: 'power2.out',
        })
      }

      // 2. Specifications grid stagger scrubbed with scroll
      const validCards = cardRefs.current.filter(Boolean) as HTMLElement[]
      if (validCards.length > 0) {
        gsap.from(validCards, {
          scrollTrigger: {
            trigger: '.specs__grid',
            start: 'top 90%',
            end: 'top 45%',
            scrub: 0.3,
            id: 'specs-cards',
          },
          opacity: 0,
          y: 40,
          stagger: 0.1,
          ease: 'power2.out',
        })
      }
    }, sectionRef)

    return () => {
      ctx.revert()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id="specifications"
      className="section specs"
      aria-label="Specifications"
    >
      <div className="container">
        <div ref={headerRef} className="specs__header">
          <span className="type-label specs__label motion-label" tabIndex={0}>
            Technical Data
          </span>
          <h2 className="type-heading-1 specs__title">Specifications</h2>
          <hr className="divider" />
          <p className="type-body specs__intro">
            The seventh-generation Accord offered two engine options, a revised platform, and
            class-leading safety ratings that redefined expectations for the mid-size segment.
          </p>
        </div>

        <div className="specs__grid">
          {specs.map((spec, index) => (
            <div
              key={spec.label}
              ref={(el) => {
                cardRefs.current[index] = el
              }}
              className="spec-card motion-card"
              tabIndex={0}
            >
              <div className="spec-card__value">
                <span className="type-stat-value">{spec.value}</span>
                {spec.unit && <span className="type-stat-unit"> {spec.unit}</span>}
              </div>
              <p className="type-label spec-card__label">{spec.label}</p>
              <p className="spec-card__description">{spec.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
