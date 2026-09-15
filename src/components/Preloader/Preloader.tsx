import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { prefersReducedMotion } from '../../animation/gsapConfig'
import './Preloader.css'

interface PreloaderProps {
  onComplete?: () => void
}

/**
 * EDITORIAL PRELOADER CURTAIN
 * STEP 20 — PRODUCTION POLISH
 *
 * Minimal, purposeful initial loading experience communicating the authentic
 * 2003 Honda Accord engineering archive identity without generic spinners.
 */
export function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0)
  const [isDismissed, setIsDismissed] = useState(false)
  const curtainRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const percentTextRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    // Accessibility check: dismiss immediately if user prefers reduced motion
    if (prefersReducedMotion()) {
      setIsDismissed(true)
      onComplete?.()
      return
    }

    const duration = 0.65 // 650ms fast calibration
    const startTime = performance.now()

    const updateTick = () => {
      const elapsed = (performance.now() - startTime) / 1000
      const currentProg = Math.min(elapsed / duration, 1.0)
      const pct = Math.round(currentProg * 100)

      setProgress(pct)

      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${pct}%`
      }
      if (percentTextRef.current) {
        percentTextRef.current.textContent = `${pct}%`
      }

      if (currentProg < 1.0) {
        requestAnimationFrame(updateTick)
      } else {
        // Complete & dismiss curtain smoothly
        if (curtainRef.current) {
          gsap.to(curtainRef.current, {
            opacity: 0,
            y: -24,
            duration: 0.5,
            ease: 'power3.inOut',
            onComplete: () => {
              setIsDismissed(true)
              onComplete?.()
            },
          })
        } else {
          setIsDismissed(true)
          onComplete?.()
        }
      }
    }

    const animId = requestAnimationFrame(updateTick)

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [onComplete])

  if (isDismissed) return null

  return (
    <aside
      ref={curtainRef}
      className="preloader-curtain"
      aria-label="Initial Engineering System Preloader"
      role="status"
      aria-live="polite"
    >
      <div className="preloader-content">
        <div className="preloader-header">
          <span className="preloader-badge">HONDA MOTOR CO. // TECHNICAL ARCHIVE</span>
          <span className="preloader-ref">SYSTEM CALIBRATION // 01-20</span>
        </div>

        <h1 className="preloader-title">
          ACCORD <span className="preloader-year">— 2003</span>
        </h1>
        <p className="preloader-subtitle">
          SEVENTH GENERATION MONOCOQUE BENCHMARK // J30A4 VTEC ENGINE
        </p>

        <div className="preloader-bar-track">
          <div ref={progressBarRef} className="preloader-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="preloader-footer">
          <span className="preloader-status">INITIALIZING MOTION ARCHITECTURE</span>
          <span ref={percentTextRef} className="preloader-percent">
            {progress}%
          </span>
        </div>
      </div>
    </aside>
  )
}
