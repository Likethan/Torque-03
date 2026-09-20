import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { createArchitectureTimeline } from '../animation/architectureTimeline'
import { prefersReducedMotion } from '../animation/gsapConfig'
import { BlueprintInspector } from './Engineering/BlueprintInspector'
import './Engineering.css'

gsap.registerPlugin(ScrollTrigger)

const engineDetails = [
  { key: 'Configuration', value: 'V6 SOHC 24-valve VTEC' },
  { key: 'Displacement', value: '2,997 cc' },
  { key: 'Bore × Stroke', value: '86.0 × 86.0 mm' },
  { key: 'Compression', value: '10.0 : 1' },
  { key: 'Fuel System', value: 'Sequential multi-port injection' },
  { key: 'Transmission', value: '5-speed automatic w/ Sport Shift' },
]

/**
 * ----------------------------------------------------------------------------
 * SCENE 2: ARCHITECTURE & POWERTRAIN (Step 9 — ScrollTrigger Integration)
 * ----------------------------------------------------------------------------
 * Demonstrates a modular ScrollTrigger-controlled narrative scene:
 * - Timeline: createArchitectureTimeline() defines WHAT animates.
 * - ScrollTrigger: controls WHEN and HOW scroll scrubs through the timeline.
 * - start: "top 80%" (element enters 80% from viewport top)
 * - end: "top 25%"   (element reaches 25% from viewport top)
 * - scrub: 1 (1s physical smoothing catch-up between scrollbar and playhead)
 */
export function Engineering() {
  const sectionRef = useRef<HTMLElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const dividerRef = useRef<HTMLHRElement>(null)
  const p1Ref = useRef<HTMLParagraphElement>(null)
  const p2Ref = useRef<HTMLParagraphElement>(null)
  const detailRefs = useRef<(HTMLDivElement | null)[]>([])
  const mediaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      // 1. Build the modular Architecture Timeline (created paused)
      const archTl = createArchitectureTimeline({
        container: sectionRef.current,
        label: labelRef.current,
        title: titleRef.current,
        divider: dividerRef.current,
        paragraphs: [p1Ref.current, p2Ref.current],
        detailItems: detailRefs.current,
        media: mediaRef.current,
      })

      // 2. Connect ScrollTrigger to scrub the timeline smoothly
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 80%', // Target top reaches 80% from top of viewport
        end: 'top 25%',   // Target top reaches 25% from top of viewport
        animation: archTl,
        scrub: 0.3,       // Responsive physical catch-up damping
        id: 'architecture-scene',
      })
    }, sectionRef)

    return () => {
      ctx.revert() // Cleanly kills ScrollTrigger and reverts styles on unmount
    }
  }, [])

  return (
    <section ref={sectionRef} id="engineering" className="section engineering" aria-label="Engineering">
      <div className="container">
        <div className="engineering__layout">
          <div className="engineering__content">
            <span ref={labelRef} className="type-label engineering__label motion-label" tabIndex={0}>
              Powertrain
            </span>
            <h2 ref={titleRef} className="type-heading-1">
              i-VTEC Intelligence
            </h2>
            <hr ref={dividerRef} className="divider" />
            <p ref={p1Ref} className="type-body engineering__text">
              Honda's Variable Valve Timing and Lift Electronic Control 
              system represents a philosophy where technology serves the 
              driver, not the other way around. The 3.0-liter V6 delivers 
              linear power across the rev range while maintaining the 
              refinement expected of a sedan at this level.
            </p>
            <p ref={p2Ref} className="type-body engineering__text">
              Variable timing on both intake and exhaust camshafts optimizes 
              cylinder filling at every engine speed — maximizing torque at 
              low RPM and power at high RPM without compromise.
            </p>

            <div className="engineering__detail-list">
              {engineDetails.map((detail, idx) => (
                <div
                  key={detail.key}
                  ref={(el) => {
                    detailRefs.current[idx] = el
                  }}
                  className="engineering__detail-item"
                >
                  <span className="engineering__detail-key motion-label" tabIndex={0}>
                    {detail.key}
                  </span>
                  <span className="engineering__detail-value">
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div ref={mediaRef} className="engineering__media motion-media-hover">
            <img
              src="/images/accord-engine.jpg"
              alt="Honda i-VTEC engine bay showing the 3.0L V6"
              loading="lazy"
            />
          </div>
        </div>

        {/* Step 12 Interaction 4: Drag and Inertia Blueprint Inspector */}
        <BlueprintInspector />
      </div>
    </section>
  )
}
