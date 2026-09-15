import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  errorMessage: string
}

/**
 * THREE ERROR BOUNDARY
 * STEP 20 — PRODUCTION POLISH
 *
 * Catches WebGL initialization failures, shader compilation crashes, or context losses.
 * Renders the accessible 2D technical CAD blueprint schematic without breaking
 * the surrounding document or navigation.
 */
export class ThreeErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    errorMessage: '',
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'Unknown WebGL rendering pipeline exception',
    }
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.warn('[ThreeErrorBoundary] WebGL scene recovery caught exception:', error, errorInfo)
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, errorMessage: '' })
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          className="three-scene-wrapper"
          role="region"
          aria-label="3D Engineering Assembly Fallback"
        >
          <div className="three-fallback">
            <svg
              className="three-fallback-cad"
              viewBox="0 0 600 360"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <pattern id="cadGridFallbackErr" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(42, 49, 58, 0.35)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="600" height="360" fill="url(#cadGridFallbackErr)" />
              <rect x="120" y="160" width="360" height="110" rx="4" stroke="rgba(140, 148, 158, 0.85)" strokeWidth="1.5" fill="rgba(36, 40, 48, 0.6)" />
              <line x1="80" y1="215" x2="520" y2="215" stroke="rgba(200, 16, 46, 0.5)" strokeWidth="1" strokeDasharray="6 4" />
              <rect x="80" y="125" width="440" height="24" rx="2" stroke="rgba(180, 190, 200, 0.9)" strokeWidth="1.5" fill="rgba(140, 148, 158, 0.4)" />
              <circle cx="140" cy="137" r="38" stroke="rgba(200, 16, 46, 0.85)" strokeWidth="1.5" fill="rgba(28, 31, 36, 0.7)" />
              <circle cx="140" cy="137" r="28" stroke="rgba(140, 148, 158, 0.6)" strokeWidth="1" strokeDasharray="3 3" />
            </svg>
            <div className="three-fallback-meta">
              <span className="three-fallback-badge">STATIC 2D SCHEMATIC MODE</span>
              <p className="three-fallback-desc">
                WebGL hardware acceleration is temporarily unavailable or experienced driver context recovery. Presenting the 2D engineering blueprint representation.
              </p>
              <button
                type="button"
                onClick={this.handleRetry}
                className="cinema-tl-btn"
                style={{ marginTop: '0.65rem', alignSelf: 'flex-start' }}
              >
                ↻ REINITIALIZE 3D STAGE
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
