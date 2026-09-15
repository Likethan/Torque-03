import type { CSSProperties } from 'react'
import './Hero.css'

/* ============================================================================
   INDEPENDENT HERO LAYERS (Step 3)
   ============================================================================
   Conceptually structured as independent layers so future animation steps
   (GSAP / ScrollTrigger) can target and manipulate each layer without
   restructuring markup:
   Hero
   ├── background
   ├── vehicle visual
   ├── title
   ├── subtitle
   ├── technical metadata
   ├── decorative technical line
   └── scroll indicator
   ============================================================================ */

export function HeroBackground() {
  return (
    <div
      className="hero-layer hero-layer--background"
      data-element="hero-background"
      aria-hidden="true"
    >
      <div className="hero-bg-glow" />
      <div className="hero-bg-vignette" />
    </div>
  )
}

interface VehicleVisualProps {
  style?: CSSProperties
  className?: string
}

export function VehicleVisual({ style, className = '' }: VehicleVisualProps) {
  return (
    <div
      className={`hero-layer hero-layer--vehicle ${className}`}
      data-element="hero-visual"
      style={style}
    >
      <div className="hero-vehicle-frame">
        <img
          src="/images/accord-hero.jpg"
          alt="2003 Honda Accord sedan in Satin Silver, studio three-quarter front angle"
          loading="eager"
          className="hero-vehicle-img"
        />
        <div className="hero-vehicle-shadow" aria-hidden="true" />
      </div>
    </div>
  )
}

export function HeroTitle() {
  return (
    <div className="hero-title-group" data-element="hero-title">
      <span className="type-label hero-series-tag" tabIndex={0}>
        Seventh Generation · CM Series
      </span>
      <h1 className="type-hero hero-main-title">
        Accord
      </h1>
    </div>
  )
}

export function HeroSubtitle() {
  return (
    <div className="hero-subtitle-layer" data-element="hero-subtitle">
      <p className="hero-subtitle-text">
        The benchmark mid-size sedan. Refined engineering, deliberate design,
        and an unwavering commitment to the driver's experience.
      </p>
    </div>
  )
}

export function HeroMeta() {
  return (
    <div className="hero-meta-layer" data-element="hero-meta">
      <div className="hero-meta-grid">
        <div className="hero-meta-item">
          <span className="type-stat-value">240</span>
          <span className="type-stat-unit">Horsepower</span>
        </div>
        <div className="hero-meta-item">
          <span className="type-stat-value">3.0L</span>
          <span className="type-stat-unit">V6 VTEC</span>
        </div>
        <div className="hero-meta-item">
          <span className="type-stat-value">2003</span>
          <span className="type-stat-unit">Model Year</span>
        </div>
      </div>
    </div>
  )
}

export function HeroTechLine() {
  return (
    <div className="hero-tech-line-layer" data-element="hero-line" aria-hidden="true">
      <div className="hero-tech-line-rule" />
      <span className="hero-tech-line-text">
        SPEC 03 · CM-SERIES ARCHITECTURE · HONDA R&amp;D
      </span>
    </div>
  )
}

export function ScrollIndicator() {
  return (
    <div className="hero-scroll-indicator" data-element="scroll-indicator" aria-hidden="true">
      <span className="scroll-indicator-label">SCROLL TO EXPLORE</span>
      <div className="scroll-indicator-track">
        <div className="scroll-indicator-bar" />
      </div>
    </div>
  )
}

/**
 * Standard Hero presentation when rendered independently.
 */
export function Hero() {
  return (
    <section className="hero-standalone" aria-label="Hero">
      <HeroBackground />
      <VehicleVisual />
      <div className="container hero-content-wrapper">
        <HeroTitle />
        <HeroSubtitle />
        <HeroTechLine />
        <HeroMeta />
        <ScrollIndicator />
      </div>
    </section>
  )
}
