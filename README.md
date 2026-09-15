# 2003 Honda Accord (7th Gen) — Interactive Engineering Archive

[![React](https://img.shields.io/badge/React-19.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r186-black?logo=three.js&logoColor=white)](https://threejs.org/)
[![GSAP](https://img.shields.io/badge/GSAP-3.15-88CE02?logo=greensock&logoColor=white)](https://greensock.com/gsap/)
[![Lenis](https://img.shields.io/badge/Lenis-Smooth_Scroll-white?logoColor=black)](https://github.com/darkroomengineering/lenis)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

An immersive, high-fidelity spatial web experience and interactive engineering archive celebrating the **7th-Generation (2003) Honda Accord**. 

Engineered with custom WebGL/Three.js shaders, frame-scrubbed scroll kinematics, GSAP choreographies, and Lenis smooth inertial scrolling to deconstruct the vehicle's monocoque chassis, J30A4 V6 powertrain, and double-wishbone suspension dynamics.

---

## Key Highlights & Features

### 1. Multi-Phase Cinematic Stage
- **Frame-Scrubbed Canvas Engine**: High-frequency canvas sequence renderer synchronized with viewport scroll progress.
- **5-Scene Architectural Narrative**:
  - `ARRIVAL`: Aerodynamic introduction and silhouette reveals.
  - `FORM`: Exterior proportions, beltlines, and aerodynamic coefficients ($C_d = 0.30$).
  - `CHASSIS`: High-tensile steel unibody cage, laser-welded subframes, and crash safety crumple zones.
  - `POWERTRAIN`: 3.0L SOHC 24-valve VTEC J30A4 V6 architecture ($240\text{ hp} @ 6,250\text{ RPM}$).
  - `CONCLUSION`: Dynamic summary and technical benchmark status.
- **HUD & Telemetry**: Live timecode, frame counter, playhead scrubber, velocity telemetry, and zero-re-render direct DOM bindings.

### 2. Interactive 3D WebGL & Three.js Engineering Stage
- **React Three Fiber & Drei Pipeline**: Configurable camera rig with waypoint interpolations, physical camera FOVs, and orbital constraints.
- **Custom Shaders**: GLSL vertex and fragment shaders for CAD wireframe inspection, fresnel rims, and mechanical isolation.
- **Assembly Explosion & X-Ray Modes**: Interactive exploded views of suspension assemblies, engine blocks, and chassis cross-sections.
- **Adaptive Performance Tiers**: Dynamic DPR and shader quality scaling based on device GPU tier and frame rate telemetry.

### 3. Blueprint Inspector & Mechanical Diagrams
- **Interactive Hotspot Callouts**: Proximity-aware HUD reticle targeting critical mechanical components.
- **Kinetic Typography & Micro-Interactions**: Magnetic button physics, smooth cursor reticles, and character-split typography animations.
- **Technical Specifications Grid**: Comprehensive specifications for dimensions, gear ratios, curb weights, and engine geometries.

### 4. Motion Architecture & Performance Engineering
- **Lenis Smooth Inertial Scrolling**: Synchronized requestAnimationFrame loop reconciling Lenis velocity with GSAP `ScrollTrigger` and Three.js render ticks.
- **Reduced Motion Support**: Full compliance with `prefers-reduced-motion: reduce`, gracefully falling back to accessible static views.

---

## Tech Stack

| Technology | Role |
| :--- | :--- |
| **React 19** | Modern UI orchestration and concurrent component architecture |
| **TypeScript** | Strict compile-time type safety across physics, math, and telemetry models |
| **Three.js & @react-three/fiber** | WebGL rendering pipeline, custom scene graph, and shader materials |
| **@react-three/drei** | Specialized 3D utilities, camera controls, and environment helpers |
| **GSAP & ScrollTrigger** | Timeline choreography, velocity tracking, and scroll-linked state machines |
| **Lenis** | Inertial momentum scrolling engine |
| **Vite** | Ultra-fast HMR and optimized production bundling |

---

## Project Structure

```text
├── public/
│   ├── favicon.svg             # Vector brand icon
│   ├── icons.svg               # SVG sprite definitions
│   └── images/                 # Optimized photographic assets
├── src/
│   ├── animation/              # GSAP timelines for each narrative phase
│   │   ├── arrivalTimeline.ts
│   │   ├── chassisTimeline.ts
│   │   ├── formTimeline.ts
│   │   ├── powertrainTimeline.ts
│   │   └── conclusionTimeline.ts
│   ├── components/
│   │   ├── CinematicStage/     # Frame-scrubbing canvas stage with layered parallax
│   │   ├── Engineering/        # Interactive 2D/3D blueprint inspector
│   │   ├── ThreeEngineeringStage/ # React Three Fiber 3D interactive model stage
│   │   ├── Interaction/        # Magnetic reticle HUD and technical cursor
│   │   ├── Preloader/          # Asset frame preloader with progress telemetry
│   │   ├── Specifications/     # Technical specs matrix and metrics
│   │   └── Header.tsx, Footer.tsx, Interior.tsx, Legacy.tsx
│   ├── hooks/                  # Custom React hooks (useLenis, useMotionEngine, useFramePreloader)
│   ├── interaction/            # Magnetic hover physics, mouse position math, interaction store
│   ├── motion/                 # Lenis manager, interpolation (lerp), clamp, scene mappers
│   ├── story/                  # Narrative state machines and phase definitions
│   ├── styles/                 # Engineering design tokens, typography, and CSS variables
│   ├── three/                  # 3D canvas, camera choreography, custom shaders, and lighting
│   │   ├── camera/             # Camera rigs, waypoints, and cinematic choreographies
│   │   ├── physics/            # Mechanical kinematics and motion constraints
│   │   ├── shaders/            # Custom GLSL shaders for CAD inspection and materials
│   │   └── webgl/              # WebGL capability detection and inspection surfaces
│   ├── App.tsx                 # Root application component
│   └── main.tsx                # Entry point
├── index.html                  # HTML5 template with SEO & Open Graph meta tags
├── package.json                # Project dependencies and build scripts
├── tsconfig.json               # TypeScript strict configuration
└── vite.config.ts              # Vite configuration with React plugin
```

---

## Getting Started

### Prerequisites

Ensure you have **Node.js** (v18.0.0 or higher recommended) and **npm** installed.

```bash
node -v
npm -v
```

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Likethan/Torque-03.git
   cd Torque-03
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development Server

Start the local development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

### Production Build

Type-check and build the optimized production bundle:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## Vehicle Specifications (Reference)

- **Platform**: Honda 7th-Generation Accord (2003 Sedan/Coupe)
- **Engine**: 3.0-Liter V6 (J30A4) SOHC 24-Valve VTEC
- **Output**: 240 hp @ 6,250 RPM | 212 lb-ft @ 5,000 RPM
- **Chassis**: High-rigidity steel monocoque with front subframe isolation
- **Suspension**: Double wishbone (Front) / Five-link double wishbone (Rear)
- **Drag Coefficient**: $0.30\ C_d$

---

## License

This project is open-source and available under the [MIT License](LICENSE).