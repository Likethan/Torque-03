import { useEffect } from 'react'
import { useLenis } from './hooks/useLenis'
import { initInteraction } from './interaction/interactionManager'
import { Preloader } from './components/Preloader/Preloader'
import { TechReticle } from './components/Interaction/TechReticle'
import { CinematicChapterIndicator } from './components/Interaction/CinematicChapterIndicator'
import { Header } from './components/Header'
import { CinematicStage } from './components/CinematicStage/CinematicStage'
import { Specifications } from './components/Specifications'
import { Engineering } from './components/Engineering'
import { ThreeEngineeringStage } from './components/ThreeEngineeringStage/ThreeEngineeringStage'
import { InteriorStage } from './components/InteriorStage/InteriorStage'
import { RoadStage } from './components/RoadStage/RoadStage'
import { AutomotiveDetailStage } from './components/DetailStage/AutomotiveDetailStage'
import { Interior } from './components/Interior'
import { Legacy } from './components/Legacy'
import { Footer } from './components/Footer'
import { VehicleDebugOverlay } from './three/vehicle/VehicleDebugOverlay'
import { WeatherDebugOverlay } from './three/environment/WeatherDebugOverlay'

export default function App() {
  // Mount Lenis smooth inertial scrolling at application root (Step 8)
  useLenis()

  // Mount centralized interaction system (Step 12)
  useEffect(() => {
    return initInteraction()
  }, [])

  return (
    <>
      <Preloader />
      <TechReticle />
      <CinematicChapterIndicator />
      <VehicleDebugOverlay />
      <WeatherDebugOverlay />
      <Header />
      <main>
        <CinematicStage />
        <Specifications />
        <Engineering />
        <ThreeEngineeringStage />
        <InteriorStage />
        <RoadStage />
        <AutomotiveDetailStage />
        <Interior />
        <Legacy />
      </main>
      <Footer />
    </>
  )
}

