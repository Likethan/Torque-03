import React, { useState, useEffect, useRef } from 'react'
import { useCinematicChapter, getCinematicState } from '../../animation/cinematicDirector'
import { scrollToTarget } from '../../motion/lenisManager'
import { prefersReducedMotion } from '../../animation/gsapConfig'
import './CinematicChapterIndicator.css'

/**
 * ----------------------------------------------------------------------------
 * CINEMATIC CHAPTER INDICATOR (Step 14 — Cinematic Chapter System)
 * ----------------------------------------------------------------------------
 * Minimalist editorial navigation index reflecting the 8 canonical chapters.
 *
 * Characteristics:
 * - Subtle monospace typography (`03 // ENGINEERING`).
 * - Real-time continuous progress hairline.
 * - Non-intrusive bottom-right positioning.
 * - Smooth scroll handoff to chapter anchors via Lenis.
 * - Fully accessible keyboard controls and screen reader announcements.
 */
export const CinematicChapterIndicator: React.FC = () => {
  const { activeChapter, allChapters } = useCinematicChapter()
  const [isExpanded, setIsExpanded] = useState(false)
  const progressLineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let animId: number

    const tick = () => {
      const state = getCinematicState()
      if (progressLineRef.current) {
        progressLineRef.current.style.transform = `scaleX(${state.masterProgress})`
      }
      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [])

  const handleChapterClick = (anchorId: string) => {
    const isReduced = prefersReducedMotion()
    scrollToTarget(`#${anchorId}`, { duration: isReduced ? 0.2 : 1.2 })
    setIsExpanded(false)
  }

  return (
    <nav
      className={`cinematic-chapter-root ${isExpanded ? 'expanded' : ''}`}
      aria-label="Cinematic Film Chapters"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Expanded Chapter Drawer */}
      {isExpanded && (
        <ul className="cinematic-chapter-list" role="list">
          {allChapters.map((ch) => {
            const isCurrent = ch.id === activeChapter.id
            return (
              <li key={ch.id} className="cinematic-chapter-item">
                <button
                  type="button"
                  className={`cinematic-chapter-btn ${isCurrent ? 'active' : ''}`}
                  onClick={() => handleChapterClick(ch.anchorId)}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <span className="chapter-btn-idx">{ch.index}</span>
                  <span className="chapter-btn-title">{ch.title}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {/* Main Collapsed Editorial Pill */}
      <div className="cinematic-chapter-bar">
        <div className="chapter-bar-progress-track">
          <div ref={progressLineRef} className="chapter-bar-progress-fill" />
        </div>

        <button
          type="button"
          className="chapter-bar-trigger"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-label={`Current chapter: ${activeChapter.index} ${activeChapter.title}. Click to view chapter index.`}
        >
          <span className="chapter-bar-status-dot" aria-hidden="true" />
          <span className="chapter-bar-index">{activeChapter.index}</span>
          <span className="chapter-bar-sep">//</span>
          <span className="chapter-bar-name">{activeChapter.title}</span>
        </button>
      </div>
    </nav>
  )
}
