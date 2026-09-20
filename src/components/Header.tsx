import { scrollToTarget } from '../motion/lenisManager'
import './Header.css'

export function Header() {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault()
    scrollToTarget(hash)
  }

  return (
    <header className="header" role="banner">
      <div className="container header__inner">
        <div
          className="header__brand"
          data-cursor="link"
          data-magnetic="true"
          data-magnetic-radius="60"
          data-magnetic-max="8"
          data-name="HONDA ACCORD"
        >
          <span className="header__brand-name">Honda Accord</span>
          <span className="header__brand-sub">Seventh Generation · 2003</span>
        </div>

        <nav className="header__nav" aria-label="Primary navigation">
          <a
            href="#cinematic-timeline"
            className="header__nav-link motion-nav-link"
            onClick={(e) => handleNavClick(e, '#cinematic-timeline')}
            data-cursor="link"
            data-magnetic="true"
            data-magnetic-radius="55"
            data-magnetic-max="10"
            data-name="NAV // TIMELINE"
          >
            Timeline
          </a>
          <a
            href="#specifications"
            className="header__nav-link motion-nav-link"
            onClick={(e) => handleNavClick(e, '#specifications')}
            data-cursor="link"
            data-magnetic="true"
            data-magnetic-radius="55"
            data-magnetic-max="10"
            data-name="NAV // SPECIFICATIONS"
          >
            Specifications
          </a>
          <a
            href="#engineering"
            className="header__nav-link motion-nav-link"
            onClick={(e) => handleNavClick(e, '#engineering')}
            data-cursor="link"
            data-magnetic="true"
            data-magnetic-radius="55"
            data-magnetic-max="10"
            data-name="NAV // ENGINEERING"
          >
            Engineering
          </a>
          <a
            href="#interior"
            className="header__nav-link motion-nav-link"
            onClick={(e) => handleNavClick(e, '#interior')}
            data-cursor="link"
            data-magnetic="true"
            data-magnetic-radius="55"
            data-magnetic-max="10"
            data-name="NAV // INTERIOR"
          >
            Interior
          </a>
          <a
            href="#legacy"
            className="header__nav-link motion-nav-link"
            onClick={(e) => handleNavClick(e, '#legacy')}
            data-cursor="link"
            data-magnetic="true"
            data-magnetic-radius="55"
            data-magnetic-max="10"
            data-name="NAV // LEGACY"
          >
            Legacy
          </a>
        </nav>
      </div>
    </header>
  )
}
