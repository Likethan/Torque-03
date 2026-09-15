import { useEffect } from 'react'
import {
  initLenis,
  destroyLenis,
  scrollToTarget,
  toggleSmoothScroll,
  getLenis,
} from '../motion/lenisManager'

/**
 * useLenis Hook (Step 8 — Smooth Scrolling with Lenis)
 *
 * Mounts Lenis smooth scroll at the application level:
 * - Initializes the singleton Lenis instance bound to GSAP's ticker
 * - Intercepts intra-page anchor clicks (a[href^="#"]) to glide smoothly via Lenis
 * - Cleans up on unmount
 */
export function useLenis() {
  useEffect(() => {
    const lenis = initLenis()
    if (!lenis) return

    // Intercept intra-page anchor clicks for smooth deceleration navigation
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      const anchor = target?.closest('a[href^="#"]') as HTMLAnchorElement | null

      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href || href === '#') return

      e.preventDefault()
      scrollToTarget(href)
    }

    document.addEventListener('click', handleAnchorClick)

    return () => {
      document.removeEventListener('click', handleAnchorClick)
      destroyLenis()
    }
  }, [])

  return {
    getLenis,
    scrollToTarget,
    toggleSmoothScroll,
  }
}
