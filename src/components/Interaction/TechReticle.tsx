import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { getInteractionState } from '../../interaction/interactionStore'
import { lerp } from '../../motion/lerp'
import { prefersReducedMotion } from '../../animation/gsapConfig'
import './TechReticle.css'

export function TechReticle() {
  const rootRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const root = rootRef.current
    const label = labelRef.current
    if (!root) return

    let currentX = window.innerWidth * 0.5
    let currentY = window.innerHeight * 0.5

    const onTick = () => {
      const state = getInteractionState()
      if (!state.isPointerInside || state.touchMode) {
        root.style.opacity = '0'
        return
      }
      root.style.opacity = '1'

      // Smooth cursor following (0.2 factor: responsive yet physically damped)
      currentX = lerp(currentX, state.pointerX, 0.2)
      currentY = lerp(currentY, state.pointerY, 0.2)

      root.style.transform = `translate3d(${currentX.toFixed(1)}px, ${currentY.toFixed(1)}px, 0)`

      if (state.activeTarget !== 'NONE') {
        root.classList.add('tech-reticle-root--active')
        if (label) {
          label.textContent = state.activeTarget
        }
      } else {
        root.classList.remove('tech-reticle-root--active')
      }
    }

    gsap.ticker.add(onTick)

    return () => {
      gsap.ticker.remove(onTick)
    }
  }, [])

  return (
    <div ref={rootRef} className="tech-reticle-root" aria-hidden="true">
      <div className="tech-reticle-ring" />
      <div className="tech-reticle-dot" />
      <span ref={labelRef} className="tech-reticle-label" />
    </div>
  )
}
