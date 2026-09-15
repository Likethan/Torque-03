import React, { useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { springStep } from '../../interaction/interactionMath';
import { interactionStore } from '../../interaction/interactionStore';
import './BlueprintInspector.css';

interface BlueprintModule {
  id: string;
  tag: string;
  title: string;
  desc: string;
  specValue: string;
  specLabel: string;
  subSpecValue: string;
  subSpecLabel: string;
}

const BLUEPRINT_MODULES: BlueprintModule[] = [
  {
    id: 'chassis',
    tag: 'CAD: CHASSIS // ARCH-01',
    title: 'Monocoque Subframe',
    desc: 'Laser-welded high-tensile steel unibody architecture with hydroformed front subframe cradle. Structural bending rigidity increased by 27% over the 6th-generation platform.',
    specValue: '+27%',
    specLabel: 'Torsional Rigidity',
    subSpecValue: '1,495 KG',
    subSpecLabel: 'Curb Weight'
  },
  {
    id: 'powertrain',
    tag: 'CAD: ENGINE // J30A4-V6',
    title: '3.0L VTEC Architecture',
    desc: 'Aluminum alloy 60-degree cylinder block with forged steel crankshaft, variable intake manifold runner length, and dual-stage VTEC camshaft profiles engaging at 4,970 RPM.',
    specValue: '240 HP',
    specLabel: 'Output @ 6250 RPM',
    subSpecValue: '212 LB-FT',
    subSpecLabel: 'Torque @ 5000 RPM'
  },
  {
    id: 'suspension',
    tag: 'CAD: CHASSIS // SUSP-03',
    title: 'Double-Wishbone Geometry',
    desc: 'Front double-wishbone with in-wheel knuckle assembly paired to rear 5-link double-wishbone geometry. Delivers negative camber compensation under dynamic lateral compression.',
    specValue: '5-LINK',
    specLabel: 'Rear Geometry',
    subSpecValue: '0.82 G',
    subSpecLabel: 'Lateral Grip'
  },
  {
    id: 'aero',
    tag: 'CAD: AERO // FLOW-04',
    title: 'Aerodynamic Floor Plan',
    desc: 'Sub-floor aerodynamic undertray diffusers, windshield rake angle optimized to 63 degrees, and flush-mounted window transitions achieving a drag coefficient of 0.30 Cd.',
    specValue: '0.30 Cd',
    specLabel: 'Drag Coefficient',
    subSpecValue: '-14%',
    subSpecLabel: 'Front Lift Coeff'
  }
];

export const BlueprintInspector: React.FC = () => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const telemetryRef = useRef<HTMLDivElement>(null);

  // Mutable drag/momentum state outside React renders
  const physicsRef = useRef({
    currentX: 0,
    targetX: 0,
    velocity: 0,
    isDragging: false,
    startX: 0,
    lastX: 0,
    lastTime: 0,
    minX: 0,
    maxX: 0,
    cardWidth: 356, // 340px card + 16px gap
    activeCardIndex: 0
  });

  // Calculate track limits
  const updateLimits = useCallback(() => {
    if (!viewportRef.current || !trackRef.current) return;
    const viewportWidth = viewportRef.current.clientWidth;
    const trackWidth = trackRef.current.scrollWidth;
    physicsRef.current.minX = Math.min(0, viewportWidth - trackWidth);
    physicsRef.current.maxX = 0;
  }, []);

  useEffect(() => {
    updateLimits();
    window.addEventListener('resize', updateLimits);

    const p = physicsRef.current;
    let animFrame: number;
    let lastTickerTime = performance.now();

    // Dedicated ticker callback for drag inertia & spring damping settling
    const onTick = () => {
      const now = performance.now();
      const dt = Math.min(0.064, (now - lastTickerTime) / 1000);
      lastTickerTime = now;

      if (!p.isDragging) {
        if (p.currentX > p.maxX) {
          // Beyond right boundary — spring back to 0
          const res = springStep(p.currentX, p.velocity, p.maxX, 220, 24, dt);
          p.currentX = res.position;
          p.velocity = res.velocity;
        } else if (p.currentX < p.minX) {
          // Beyond left boundary — spring back to minX
          const res = springStep(p.currentX, p.velocity, p.minX, 220, 24, dt);
          p.currentX = res.position;
          p.velocity = res.velocity;
        } else {
          // Coasting within boundaries with exponential damping
          p.velocity *= Math.pow(0.88, dt * 60);
          p.currentX += p.velocity * (dt * 60);

          if (Math.abs(p.velocity) < 0.05) {
            p.velocity = 0;
          }
        }
      }

      // Render directly to track element
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${p.currentX.toFixed(2)}px, 0, 0)`;
      }

      // Update telemetry display
      if (telemetryRef.current) {
        const activeIdx = Math.min(
          BLUEPRINT_MODULES.length - 1,
          Math.max(0, Math.round(Math.abs(p.currentX) / p.cardWidth))
        );
        telemetryRef.current.textContent = `INDEX: [0${activeIdx + 1}/04] | OFFSET: ${p.currentX.toFixed(0)}PX | VELOCITY: ${p.velocity.toFixed(1)}PX/F`;
      }

      animFrame = requestAnimationFrame(onTick);
    };

    animFrame = requestAnimationFrame(onTick);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', updateLimits);
    };
  }, [updateLimits]);

  // Pointer Handlers for Drag with Inertia
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only respond to primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const p = physicsRef.current;
    p.isDragging = true;
    p.startX = e.clientX;
    p.lastX = e.clientX;
    p.lastTime = performance.now();
    p.velocity = 0;

    viewportRef.current?.setPointerCapture(e.pointerId);
    viewportRef.current?.classList.add('blueprint-inspector__viewport--dragging');

    // Notify central interaction store
    interactionStore.setActiveInteraction('CAD BLUEPRINT INSPECTOR', 1.0);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = physicsRef.current;
    if (!p.isDragging) return;

    const now = performance.now();
    const dt = Math.max(1, now - p.lastTime);
    const deltaX = e.clientX - p.lastX;

    // Direct translation with boundary resistance
    if (p.currentX > p.maxX) {
      p.currentX += deltaX * 0.3; // Rubber-band resistance right
    } else if (p.currentX < p.minX) {
      p.currentX += deltaX * 0.3; // Rubber-band resistance left
    } else {
      p.currentX += deltaX;
    }

    // Measure drag release velocity (smoothed)
    const instantVelocity = (deltaX / dt) * 16.67; // Normalized to 60fps frame delta
    p.velocity = p.velocity * 0.6 + instantVelocity * 0.4;

    p.lastX = e.clientX;
    p.lastTime = now;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = physicsRef.current;
    if (!p.isDragging) return;

    p.isDragging = false;
    viewportRef.current?.releasePointerCapture(e.pointerId);
    viewportRef.current?.classList.remove('blueprint-inspector__viewport--dragging');

    // Reset interaction target
    interactionStore.setActiveInteraction('NONE', 0, 0);
  };

  // Nav Button handlers for accessibility / keyboard users
  const navigateCard = (direction: 'prev' | 'next') => {
    const p = physicsRef.current;
    updateLimits();

    const currentCard = Math.round(Math.abs(p.currentX) / p.cardWidth);
    const targetCard = direction === 'next' 
      ? Math.min(BLUEPRINT_MODULES.length - 1, currentCard + 1)
      : Math.max(0, currentCard - 1);

    const targetX = Math.max(p.minX, Math.min(0, -targetCard * p.cardWidth));

    gsap.to(p, {
      currentX: targetX,
      velocity: 0,
      duration: 0.6,
      ease: 'power3.out'
    });
  };

  return (
    <div 
      className="blueprint-inspector"
      data-interaction-target="CAD INSPECTOR"
      aria-label="Accord Engineering Component Blueprint Inspector"
    >
      <div className="blueprint-inspector__header">
        <div className="blueprint-inspector__title">
          <span className="tech-spec-indicator" aria-hidden="true" />
          INTERACTIVE BLUEPRINT &amp; COMPONENT INERTIA INSPECTOR
        </div>
        <div className="blueprint-inspector__cue" aria-hidden="true">
          DRAG HORIZONTALLY TO INSPECT MODULES &bull; MOMENTUM CARRIED ON RELEASE
        </div>
      </div>

      <div 
        ref={viewportRef}
        className="blueprint-inspector__viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="region"
        tabIndex={0}
        aria-roledescription="carousel"
        aria-label="Engineering Subsystem Blueprints"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') navigateCard('next');
          if (e.key === 'ArrowLeft') navigateCard('prev');
        }}
      >
        <div ref={trackRef} className="blueprint-inspector__track">
          {BLUEPRINT_MODULES.map((mod) => (
            <article 
              key={mod.id} 
              className="blueprint-card"
              data-hover-sound="subtle"
            >
              <div className="blueprint-card__tag">
                <span>{mod.tag}</span>
                <span className="tech-cad-marker" aria-hidden="true">+</span>
              </div>
              <div>
                <h4 className="blueprint-card__title">{mod.title}</h4>
                <p className="blueprint-card__desc">{mod.desc}</p>
              </div>
              <div className="blueprint-card__specs">
                <div>
                  <div className="blueprint-card__spec-val">{mod.specValue}</div>
                  <div className="blueprint-card__spec-lbl">{mod.specLabel}</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div className="blueprint-card__spec-val">{mod.subSpecValue}</div>
                  <div className="blueprint-card__spec-lbl">{mod.subSpecLabel}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="blueprint-inspector__footer">
        <div ref={telemetryRef} className="blueprint-inspector__telemetry" aria-live="polite">
          INDEX: [01/04] | OFFSET: 0PX | VELOCITY: 0.0PX/F
        </div>
        <div className="blueprint-inspector__controls">
          <button 
            type="button" 
            className="blueprint-inspector__btn"
            onClick={() => navigateCard('prev')}
            aria-label="Previous Blueprint Module"
          >
            &larr; PREV
          </button>
          <button 
            type="button" 
            className="blueprint-inspector__btn"
            onClick={() => navigateCard('next')}
            aria-label="Next Blueprint Module"
          >
            NEXT &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
