import { useEffect } from 'react'
import { useLenis } from './hooks/useLenis'
import { initInteraction } from './interaction/interactionManager'
import { Preloader } from './components/Preloader/Preloader'
import { TechReticle } from './components/Interaction/TechReticle'
import { Header } from './components/Header'
import { CinematicStage } from './components/CinematicStage/CinematicStage'
import { Specifications } from './components/Specifications'
import { Engineering } from './components/Engineering'
import { ThreeEngineeringStage } from './components/ThreeEngineeringStage/ThreeEngineeringStage'
import { Interior } from './components/Interior'
import { Legacy } from './components/Legacy'
import { Footer } from './components/Footer'

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
      <Header />
      <main>
        <CinematicStage />
        <Specifications />
        <Engineering />
        <ThreeEngineeringStage />
        <Interior />
        <Legacy />
      </main>
      <Footer />
    </>
  )
}
