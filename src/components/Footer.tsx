import './Footer.css'

export function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer__inner">
          <div className="footer__brand">
            <span className="footer__brand-name">Honda Accord</span>
            <p className="footer__brand-note">
              An interactive editorial archive of the 2003 Honda Accord, 
              seventh generation. Not affiliated with Honda Motor Co., Ltd.
            </p>
          </div>

          <nav className="footer__links" aria-label="Footer navigation">
            <a href="#specifications" className="footer__link motion-nav-link">
              Specifications
            </a>
            <a href="#engineering" className="footer__link motion-nav-link">
              Engineering
            </a>
            <a href="#interior" className="footer__link motion-nav-link">
              Interior
            </a>
            <a href="#legacy" className="footer__link motion-nav-link">
              Legacy
            </a>
          </nav>
        </div>

        <p className="footer__copyright">
          © 2003 · Honda Accord Archive · Educational Reference
        </p>
      </div>
    </footer>
  )
}
