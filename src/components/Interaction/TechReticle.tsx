import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { getInteractionState } from '../../interaction/interactionStore'
import { prefersReducedMotion } from '../../animation/gsapConfig'
import './TechReticle.css'

export function TechReticle() {
  const rootRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const followerRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const root = rootRef.current
    const dot = dotRef.current
    const follower = followerRef.current
    const badge = badgeRef.current
    if (!root || !dot || !follower) return

    let prevMode = 'DEFAULT'
    let isVisible = false

    const onTick = () => {
      const state = getInteractionState()

      // Hide cursor on touch devices or when pointer leaves window
      if (!state.isPointerInside || state.touchMode) {
        if (isVisible) {
          root.style.opacity = '0'
          isVisible = false
        }
        return
      }

      if (!isVisible) {
        root.style.opacity = '1'
        isVisible = true
      }

      // 1. PRIMARY PRECISION DOT: Instantaneous pinpoint accuracy
      dot.style.transform = `translate3d(${state.pointerX.toFixed(1)}px, ${state.pointerY.toFixed(1)}px, 0)`

      // 2. SECONDARY TRAILING FOLLOWER: Physically damped with inertia from Step 4 physics
      // Velocity momentum scales follower slightly during high-speed movement (max 1.25x)
      const speedScale = 1 + Math.min(state.speed * 0.08, 0.25)
      follower.style.transform = `translate3d(${state.followerX.toFixed(1)}px, ${state.followerY.toFixed(1)}px, 0) scale(${speedScale.toFixed(3)})`

      // 3. CONTEXTUAL CURSOR MODES & BADGE TRANSITIONS
      const currentMode = state.cursorMode
      if (currentMode !== prevMode) {
        root.className = `tech-cursor-root tech-cursor--${currentMode.toLowerCase()}`
        prevMode = currentMode
      }

      // Contextual label
      if (badge) {
        const labelText = state.cursorLabel || (currentMode === 'VIEW' ? 'VIEW' : currentMode === 'EXPLORE' ? 'EXPLORE' : currentMode === 'SCRUB' ? 'SCRUB' : '')
        if (labelText) {
          badge.textContent = labelText
          badge.style.opacity = '1'
          badge.style.transform = `translate3d(${state.followerX.toFixed(1)}px, ${(state.followerY + 22).toFixed(1)}px, 0)`
        } else {
          badge.style.opacity = '0'
        }
      }
    }

    gsap.ticker.add(onTick)

    return () => {
      gsap.ticker.remove(onTick)
    }
  }, [])

  return (
    <div ref={rootRef} className="tech-cursor-root" aria-hidden="true">
      {/* Primary pinpoint dot */}
      <div ref={dotRef} className="tech-cursor-dot" />

      {/* Secondary physically damped follower ring */}
      <div ref={followerRef} className="tech-cursor-follower">
        <span className="tech-follower-crosshair-h" />
        <span className="tech-follower-crosshair-v" />
      </div>

      {/* Contextual micro-badge for VIEW / EXPLORE / SCRUB */}
      <span ref={badgeRef} className="tech-cursor-badge" />
    </div>
  )
}
